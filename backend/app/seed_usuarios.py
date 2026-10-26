"""Crea las cuentas de acceso iniciales.

Uso:
    python -m app.seed_usuarios

Crea (si no existen):
  - Un usuario ADMIN (por defecto: admin / admin123)
  - Un usuario CHOFER por cada chofer registrado (usuario = DNI, clave = chofer123)

Las contraseñas se pueden cambiar con las variables de entorno
ADMIN_USUARIO, ADMIN_PASSWORD y CHOFER_PASSWORD.
"""

import os

from sqlalchemy import select

from .auth import hashear_password
from .database import Base, SessionLocal, engine
from .models import Chofer, Usuario

ADMIN_USUARIO = os.getenv("ADMIN_USUARIO", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
CHOFER_PASSWORD = os.getenv("CHOFER_PASSWORD", "chofer123")


def main() -> None:
    # Permite ejecutar el script sobre una base vacía, sin iniciar la API antes.
    Base.metadata.create_all(bind=engine)

    creados: list[str] = []

    with SessionLocal() as db:
        admin = db.scalar(select(Usuario).where(Usuario.usuario_nombre == ADMIN_USUARIO))
        if admin is None:
            db.add(
                Usuario(
                    usuario_nombre=ADMIN_USUARIO,
                    password_hash=hashear_password(ADMIN_PASSWORD),
                    rol="ADMIN",
                )
            )
            creados.append(f"ADMIN  {ADMIN_USUARIO} / {ADMIN_PASSWORD}")

        for chofer in db.scalars(select(Chofer).order_by(Chofer.chofer_dni)):
            ya_tiene = db.scalar(select(Usuario).where(Usuario.chofer_dni == chofer.chofer_dni))
            if ya_tiene is not None:
                continue
            db.add(
                Usuario(
                    usuario_nombre=chofer.chofer_dni,
                    password_hash=hashear_password(CHOFER_PASSWORD),
                    rol="CHOFER",
                    chofer_dni=chofer.chofer_dni,
                )
            )
            creados.append(f"CHOFER {chofer.chofer_dni} / {CHOFER_PASSWORD}")

        db.commit()

    if creados:
        print("Usuarios creados:")
        for credencial in creados:
            print(f"  {credencial}")
    else:
        print("No había usuarios nuevos para crear.")

    print("\nImportante: cambiar estas contraseñas antes de publicar la aplicación.")


if __name__ == "__main__":
    main()
