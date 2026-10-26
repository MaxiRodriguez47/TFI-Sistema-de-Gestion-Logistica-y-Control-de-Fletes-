"""Configuración de pytest: base de datos temporal, cliente y usuarios de prueba."""

import os
import pathlib
import tempfile

# Se configura ANTES de importar la app para que use una base descartable.
TEST_DIR = pathlib.Path(tempfile.mkdtemp(prefix="logistica_agro_test_"))
os.environ["DATABASE_URL"] = f"sqlite:///{(TEST_DIR / 'test.db').as_posix()}"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.auth import hashear_password  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Usuario  # noqa: E402

API = "/api/v1"
PASSWORD = "secreto123"


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as cliente:
        yield cliente


@pytest.fixture(autouse=True)
def base_limpia(client):
    """Cada test arranca con el esquema vacío."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def crear_usuario(usuario_nombre: str, rol: str, chofer_dni: str | None = None) -> None:
    """Inserta una cuenta directamente en la base de pruebas."""
    with SessionLocal() as db:
        db.add(
            Usuario(
                usuario_nombre=usuario_nombre,
                password_hash=hashear_password(PASSWORD),
                rol=rol,
                chofer_dni=chofer_dni,
            )
        )
        db.commit()


def autenticar(client, usuario_nombre: str) -> dict[str, str]:
    """Devuelve el header Authorization del usuario indicado."""
    respuesta = client.post(
        f"{API}/auth/login",
        data={"username": usuario_nombre, "password": PASSWORD},
    )
    assert respuesta.status_code == 200, respuesta.text
    return {"Authorization": f"Bearer {respuesta.json()['access_token']}"}


@pytest.fixture
def admin(client) -> dict[str, str]:
    """Usuario administrador autenticado."""
    crear_usuario("admin", "ADMIN")
    return autenticar(client, "admin")


@pytest.fixture
def datos(client, admin):
    """Crea el conjunto mínimo de entidades relacionadas para operar con viajes."""
    localidad = client.post(
        f"{API}/localidades",
        headers=admin,
        json={"localidad_nombre": "Concepción", "departamento": "Chicligasta"},
    ).json()
    finca = client.post(
        f"{API}/fincas",
        headers=admin,
        json={"finca_nombre": "La Esperanza", "id_localidad": localidad["id_localidad"]},
    ).json()
    producto = client.post(
        f"{API}/productos",
        headers=admin,
        json={"producto_cuit": "20-12345678-3", "producto_nombre": "Pérez, Juan"},
    ).json()
    client.post(
        f"{API}/fincas/{finca['id_finca']}/productores/{producto['producto_cuit']}",
        headers=admin,
    )
    camion = client.post(f"{API}/camiones", headers=admin, json={"camion_patente": "AB123CD"}).json()
    chofer = client.post(
        f"{API}/choferes",
        headers=admin,
        json={
            "chofer_dni": "30111222",
            "chofer_nombre": "Gómez, Luis",
            "telefonos": ["3865400001"],
        },
    ).json()
    ingenio = client.post(f"{API}/ingenios", headers=admin, json={"ingenio_nombre": "Ingenio Concepción"}).json()
    return {
        "localidad": localidad,
        "finca": finca,
        "producto": producto,
        "camion": camion,
        "chofer": chofer,
        "ingenio": ingenio,
    }


@pytest.fixture
def chofer(client, datos) -> dict[str, str]:
    """Usuario chofer autenticado, vinculado al chofer de `datos`."""
    crear_usuario("lgomez", "CHOFER", chofer_dni=datos["chofer"]["chofer_dni"])
    return autenticar(client, "lgomez")
