"""Pruebas de integración de la API (autenticación, roles y viajes)."""

API = "/api/v1"


def payload_viaje(datos, **cambios):
    viaje = {
        "id_viaje": "V001",
        "id_finca": datos["finca"]["id_finca"],
        "producto_cuit": datos["producto"]["producto_cuit"],
        "camion_patente": datos["camion"]["camion_patente"],
        "chofer_dni": datos["chofer"]["chofer_dni"],
        "id_ingenio": datos["ingenio"]["id_ingenio"],
        "num_vale": "VAL-001",
        "peso_bruto_kg": 32500,
        "tara_kg": 12000,
        "tarifa_ton": 8500,
    }
    viaje.update(cambios)
    return viaje


# ---------------------------------------------------------------------------
# Inicio y autenticación
# ---------------------------------------------------------------------------


def test_inicio_y_health(client):
    respuesta = client.get("/")
    assert respuesta.status_code == 200
    assert respuesta.json()["api"] == API

    salud = client.get("/health")
    assert salud.status_code == 200
    assert salud.json() == {"status": "ok"}


def test_sin_token_devuelve_401(client):
    assert client.get(f"{API}/fincas").status_code == 401
    assert client.get(f"{API}/viajes").status_code == 401


def test_login_credenciales_incorrectas(client):
    from conftest import crear_usuario

    crear_usuario("admin", "ADMIN")
    respuesta = client.post(f"{API}/auth/login", data={"username": "admin", "password": "incorrecta"})
    assert respuesta.status_code == 401


def test_login_y_me(client, admin, chofer, datos):
    me_admin = client.get(f"{API}/auth/me", headers=admin)
    assert me_admin.status_code == 200
    assert me_admin.json()["rol"] == "ADMIN"
    assert me_admin.json()["chofer_dni"] is None

    me_chofer = client.get(f"{API}/auth/me", headers=chofer)
    assert me_chofer.status_code == 200
    assert me_chofer.json()["rol"] == "CHOFER"
    assert me_chofer.json()["chofer_dni"] == datos["chofer"]["chofer_dni"]
    assert me_chofer.json()["chofer_nombre"] == "Gómez, Luis"


# ---------------------------------------------------------------------------
# Gestión de usuarios (solo administradores)
# ---------------------------------------------------------------------------


def test_admin_gestiona_usuarios(client, admin, datos):
    crear = client.post(
        f"{API}/usuarios",
        headers=admin,
        json={"usuario_nombre": "jefe2", "password": "otraClave1", "rol": "ADMIN"},
    )
    assert crear.status_code == 201
    assert crear.json()["rol"] == "ADMIN"

    chofer_nuevo = client.post(
        f"{API}/usuarios",
        headers=admin,
        json={
            "usuario_nombre": "chofer2",
            "password": "otraClave1",
            "rol": "CHOFER",
            "chofer_dni": datos["chofer"]["chofer_dni"],
        },
    )
    assert chofer_nuevo.status_code == 201
    assert chofer_nuevo.json()["chofer_nombre"] == "Gómez, Luis"

    listado = client.get(f"{API}/usuarios", headers=admin)
    assert listado.status_code == 200
    assert {u["usuario_nombre"] for u in listado.json()} == {"admin", "jefe2", "chofer2"}

    # Un DNI no puede tener dos cuentas
    repetido = client.post(
        f"{API}/usuarios",
        headers=admin,
        json={
            "usuario_nombre": "chofer3",
            "password": "otraClave1",
            "rol": "CHOFER",
            "chofer_dni": datos["chofer"]["chofer_dni"],
        },
    )
    assert repetido.status_code == 409


def test_chofer_no_gestiona_usuarios(client, chofer):
    assert client.get(f"{API}/usuarios", headers=chofer).status_code == 403
    crear = client.post(
        f"{API}/usuarios",
        headers=chofer,
        json={"usuario_nombre": "intruso", "password": "otraClave1", "rol": "ADMIN"},
    )
    assert crear.status_code == 403


def test_admin_cambia_password_y_desactiva_usuario(client, admin, chofer):
    usuarios = client.get(f"{API}/usuarios", headers=admin).json()
    chofer_id = next(u["id_usuario"] for u in usuarios if u["rol"] == "CHOFER")
    admin_id = next(u["id_usuario"] for u in usuarios if u["rol"] == "ADMIN")

    cambio = client.put(f"{API}/usuarios/{chofer_id}", headers=admin, json={"password": "nuevaClave1"})
    assert cambio.status_code == 200

    login = client.post(f"{API}/auth/login", data={"username": "lgomez", "password": "nuevaClave1"})
    assert login.status_code == 200

    desactivar = client.put(f"{API}/usuarios/{chofer_id}", headers=admin, json={"activo": False})
    assert desactivar.status_code == 200
    assert desactivar.json()["activo"] is False

    bloqueado = client.post(f"{API}/auth/login", data={"username": "lgomez", "password": "nuevaClave1"})
    assert bloqueado.status_code == 403

    # Un administrador no puede desactivarse a sí mismo
    auto = client.put(f"{API}/usuarios/{admin_id}", headers=admin, json={"activo": False})
    assert auto.status_code == 400


# ---------------------------------------------------------------------------
# Catálogos: lectura para ambos roles, escritura solo del administrador
# ---------------------------------------------------------------------------


def test_crud_localidad(client, admin):
    crear = client.post(
        f"{API}/localidades",
        headers=admin,
        json={"localidad_nombre": "Aguilares", "departamento": "Aguilares"},
    )
    assert crear.status_code == 201
    localidad = crear.json()
    assert localidad["id_localidad"] > 0

    listado = client.get(f"{API}/localidades", headers=admin)
    assert listado.status_code == 200
    assert [loc["localidad_nombre"] for loc in listado.json()] == ["Aguilares"]

    # No se puede repetir la misma localidad en el mismo departamento
    duplicada = client.post(
        f"{API}/localidades",
        headers=admin,
        json={"localidad_nombre": "Aguilares", "departamento": "Aguilares"},
    )
    assert duplicada.status_code == 409

    actualizar = client.put(
        f"{API}/localidades/{localidad['id_localidad']}",
        headers=admin,
        json={"localidad_nombre": "Aguilares", "departamento": "Río Chico"},
    )
    assert actualizar.status_code == 200
    assert actualizar.json()["departamento"] == "Río Chico"

    finca = client.post(
        f"{API}/fincas",
        headers=admin,
        json={"finca_nombre": "La Florida", "id_localidad": localidad["id_localidad"]},
    ).json()

    # Una localidad con fincas no se puede eliminar
    assert client.delete(f"{API}/localidades/{localidad['id_localidad']}", headers=admin).status_code == 409

    assert client.delete(f"{API}/fincas/{finca['id_finca']}", headers=admin).status_code == 204
    assert client.delete(f"{API}/localidades/{localidad['id_localidad']}", headers=admin).status_code == 204


def test_finca_rechaza_localidad_inexistente(client, admin):
    respuesta = client.post(
        f"{API}/fincas",
        headers=admin,
        json={"finca_nombre": "Sin localidad", "id_localidad": 9999},
    )
    assert respuesta.status_code == 404


def test_crud_finca(client, admin):
    localidad = client.post(
        f"{API}/localidades",
        headers=admin,
        json={"localidad_nombre": "Monteros", "departamento": "Monteros"},
    ).json()
    crear = client.post(
        f"{API}/fincas",
        headers=admin,
        json={"finca_nombre": "El Porvenir", "id_localidad": localidad["id_localidad"]},
    )
    assert crear.status_code == 201
    finca = crear.json()
    assert finca["id_finca"] > 0
    assert finca["productores"] == []
    assert finca["localidad"]["localidad_nombre"] == "Monteros"
    assert finca["localidad"]["departamento"] == "Monteros"

    listado = client.get(f"{API}/fincas", headers=admin)
    assert listado.status_code == 200
    assert len(listado.json()) == 1

    actualizar = client.put(
        f"{API}/fincas/{finca['id_finca']}",
        headers=admin,
        json={"finca_nombre": "El Porvenir II", "id_localidad": localidad["id_localidad"]},
    )
    assert actualizar.status_code == 200
    assert actualizar.json()["finca_nombre"] == "El Porvenir II"

    eliminar = client.delete(f"{API}/fincas/{finca['id_finca']}", headers=admin)
    assert eliminar.status_code == 204
    assert client.get(f"{API}/fincas/{finca['id_finca']}", headers=admin).status_code == 404


def test_chofer_solo_lee_catalogos(client, admin, chofer, datos):
    assert client.get(f"{API}/localidades", headers=chofer).status_code == 200
    assert client.get(f"{API}/fincas", headers=chofer).status_code == 200
    assert client.get(f"{API}/camiones", headers=chofer).status_code == 200
    assert client.get(f"{API}/choferes", headers=chofer).status_code == 200
    assert client.get(f"{API}/ingenios", headers=chofer).status_code == 200
    assert client.get(f"{API}/productos", headers=chofer).status_code == 200

    crear = client.post(f"{API}/camiones", headers=chofer, json={"camion_patente": "ZZ999ZZ"})
    assert crear.status_code == 403

    crear_localidad = client.post(
        f"{API}/localidades",
        headers=chofer,
        json={"localidad_nombre": "Lules", "departamento": "Lules"},
    )
    assert crear_localidad.status_code == 403

    editar = client.put(
        f"{API}/fincas/{datos['finca']['id_finca']}",
        headers=chofer,
        json={"finca_nombre": "Cambio", "id_localidad": datos["localidad"]["id_localidad"]},
    )
    assert editar.status_code == 403

    borrar = client.delete(f"{API}/choferes/{datos['chofer']['chofer_dni']}", headers=chofer)
    assert borrar.status_code == 403


def test_asociacion_productor_finca(client, admin):
    localidad = client.post(
        f"{API}/localidades",
        headers=admin,
        json={"localidad_nombre": "Simoca", "departamento": "Simoca"},
    ).json()
    finca = client.post(
        f"{API}/fincas",
        headers=admin,
        json={"finca_nombre": "San José", "id_localidad": localidad["id_localidad"]},
    ).json()
    producto = client.post(
        f"{API}/productos",
        headers=admin,
        json={"producto_cuit": "27-34567890-5", "producto_nombre": "Rodríguez, Carlos"},
    ).json()

    asociar = client.post(
        f"{API}/fincas/{finca['id_finca']}/productores/{producto['producto_cuit']}",
        headers=admin,
    )
    assert asociar.status_code == 200
    assert [p["producto_cuit"] for p in asociar.json()["productores"]] == [producto["producto_cuit"]]

    # Asociar dos veces no duplica
    repetir = client.post(
        f"{API}/fincas/{finca['id_finca']}/productores/{producto['producto_cuit']}",
        headers=admin,
    )
    assert len(repetir.json()["productores"]) == 1

    desasociar = client.delete(
        f"{API}/fincas/{finca['id_finca']}/productores/{producto['producto_cuit']}",
        headers=admin,
    )
    assert desasociar.status_code == 200
    assert desasociar.json()["productores"] == []


def test_chofer_con_telefonos(client, admin):
    crear = client.post(
        f"{API}/choferes",
        headers=admin,
        json={
            "chofer_dni": "28444555",
            "chofer_nombre": "Díaz, Ana",
            "telefonos": ["3814555000", "3814555001"],
        },
    )
    assert crear.status_code == 201
    assert crear.json()["telefonos"] == ["3814555000", "3814555001"]

    actualizar = client.put(
        f"{API}/choferes/28444555",
        headers=admin,
        json={"chofer_dni": "28444555", "chofer_nombre": "Díaz, Ana María", "telefonos": ["3814555000"]},
    )
    assert actualizar.status_code == 200
    assert actualizar.json()["telefonos"] == ["3814555000"]

    duplicados = client.post(
        f"{API}/choferes",
        headers=admin,
        json={
            "chofer_dni": "35666777",
            "chofer_nombre": "Sosa, Pedro",
            "telefonos": ["3814555000", "3814555000"],
        },
    )
    assert duplicados.status_code == 422


# ---------------------------------------------------------------------------
# Viajes
# ---------------------------------------------------------------------------


def test_viaje_calcula_neto_y_flete(client, admin, datos):
    crear = client.post(f"{API}/viajes", headers=admin, json=payload_viaje(datos))
    assert crear.status_code == 201
    viaje = crear.json()
    assert viaje["peso_neto_kg"] == 20500.0
    assert viaje["flete"] == 174250.0
    assert viaje["finca"]["finca_nombre"] == "La Esperanza"
    assert viaje["ingenio"]["ingenio_nombre"] == "Ingenio Concepción"

    obtenido = client.get(f"{API}/viajes/V001", headers=admin)
    assert obtenido.status_code == 200
    assert obtenido.json()["flete"] == 174250.0


def test_viaje_actualiza_calculo(client, admin, datos):
    client.post(f"{API}/viajes", headers=admin, json=payload_viaje(datos))
    actualizar = client.put(
        f"{API}/viajes/V001",
        headers=admin,
        json=payload_viaje(datos, peso_bruto_kg=35000, tara_kg=13000, tarifa_ton=9000),
    )
    assert actualizar.status_code == 200
    assert actualizar.json()["peso_neto_kg"] == 22000.0
    assert actualizar.json()["flete"] == 198000.0


def test_viaje_rechaza_bruto_menor_que_tara(client, admin, datos):
    respuesta = client.post(
        f"{API}/viajes",
        headers=admin,
        json=payload_viaje(datos, peso_bruto_kg=10000, tara_kg=11000),
    )
    assert respuesta.status_code == 422


def test_viaje_rechaza_vale_duplicado(client, admin, datos):
    assert client.post(f"{API}/viajes", headers=admin, json=payload_viaje(datos)).status_code == 201
    repetido = client.post(
        f"{API}/viajes",
        headers=admin,
        json=payload_viaje(datos, id_viaje="V002", num_vale="VAL-001"),
    )
    assert repetido.status_code == 409


def test_viaje_rechaza_productor_no_asociado(client, admin, datos):
    otro = client.post(
        f"{API}/productos",
        headers=admin,
        json={"producto_cuit": "23-23456789-4", "producto_nombre": "Gómez, María"},
    ).json()
    respuesta = client.post(
        f"{API}/viajes",
        headers=admin,
        json=payload_viaje(datos, producto_cuit=otro["producto_cuit"]),
    )
    assert respuesta.status_code == 400


def test_no_elimina_finca_con_viajes(client, admin, datos):
    client.post(f"{API}/viajes", headers=admin, json=payload_viaje(datos))
    respuesta = client.delete(f"{API}/fincas/{datos['finca']['id_finca']}", headers=admin)
    assert respuesta.status_code == 409


def test_filtros_de_viajes(client, admin, datos):
    client.post(f"{API}/viajes", headers=admin, json=payload_viaje(datos))
    client.post(
        f"{API}/viajes",
        headers=admin,
        json=payload_viaje(datos, id_viaje="V002", num_vale="VAL-002", camion_patente="AB123CD"),
    )

    por_ingenio = client.get(
        f"{API}/viajes",
        headers=admin,
        params={"id_ingenio": datos["ingenio"]["id_ingenio"]},
    )
    assert por_ingenio.status_code == 200
    assert len(por_ingenio.json()) == 2

    sin_resultados = client.get(f"{API}/viajes", headers=admin, params={"chofer_dni": "99999999"})
    assert sin_resultados.json() == []


def test_viaje_inexistente(client, admin):
    assert client.get(f"{API}/viajes/NO-EXISTE", headers=admin).status_code == 404


# ---------------------------------------------------------------------------
# Reglas de propiedad para el rol chofer
# ---------------------------------------------------------------------------


def test_chofer_registra_su_viaje_con_pesos_y_tarifa(client, chofer, datos):
    crear = client.post(f"{API}/viajes", headers=chofer, json=payload_viaje(datos))
    assert crear.status_code == 201
    viaje = crear.json()
    assert viaje["chofer_dni"] == datos["chofer"]["chofer_dni"]
    assert viaje["peso_neto_kg"] == 20500.0
    assert viaje["flete"] == 174250.0

    mios = client.get(f"{API}/viajes/mis-viajes", headers=chofer)
    assert mios.status_code == 200
    assert [v["id_viaje"] for v in mios.json()] == ["V001"]


def test_chofer_no_registra_viaje_para_otro(client, admin, chofer, datos):
    otro = client.post(
        f"{API}/choferes",
        headers=admin,
        json={"chofer_dni": "30999888", "chofer_nombre": "Otro, Chofer", "telefonos": []},
    )
    assert otro.status_code == 201

    respuesta = client.post(
        f"{API}/viajes",
        headers=chofer,
        json=payload_viaje(datos, chofer_dni=otro.json()["chofer_dni"]),
    )
    assert respuesta.status_code == 403


def test_chofer_solo_ve_y_edita_sus_viajes(client, admin, chofer, datos):
    # Viaje propio y viaje de otro chofer, ambos creados por el administrador.
    otro = client.post(
        f"{API}/choferes",
        headers=admin,
        json={"chofer_dni": "30999888", "chofer_nombre": "Otro, Chofer", "telefonos": []},
    ).json()
    client.post(f"{API}/viajes", headers=admin, json=payload_viaje(datos))
    client.post(
        f"{API}/viajes",
        headers=admin,
        json=payload_viaje(datos, id_viaje="V002", num_vale="VAL-002", chofer_dni=otro["chofer_dni"]),
    )

    listado = client.get(f"{API}/viajes", headers=chofer)
    assert listado.status_code == 200
    assert [v["id_viaje"] for v in listado.json()] == ["V001"]

    ajeno = client.get(f"{API}/viajes/V002", headers=chofer)
    assert ajeno.status_code == 404

    editar_ajeno = client.put(
        f"{API}/viajes/V002", headers=chofer, json=payload_viaje(datos, chofer_dni=otro["chofer_dni"])
    )
    assert editar_ajeno.status_code == 404

    editar_propio = client.put(
        f"{API}/viajes/V001",
        headers=chofer,
        json=payload_viaje(datos, tarifa_ton=9000),
    )
    assert editar_propio.status_code == 200
    assert editar_propio.json()["flete"] == 184500.0

    borrar = client.delete(f"{API}/viajes/V001", headers=chofer)
    assert borrar.status_code == 403


def test_chofer_no_puede_eliminar_viaje(client, admin, chofer, datos):
    client.post(f"{API}/viajes", headers=admin, json=payload_viaje(datos))
    assert client.delete(f"{API}/viajes/V001", headers=chofer).status_code == 403
    assert client.delete(f"{API}/viajes/V001", headers=admin).status_code == 204
