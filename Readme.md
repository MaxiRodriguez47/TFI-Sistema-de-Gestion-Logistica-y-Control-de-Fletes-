# 🌾 Sistema de Gestión Logística y Control de Fletes de Caña de Azúcar


Este proyecto consiste en el diseño y desarrollo de una plataforma backend (API REST) destinada a la digitalización, seguimiento y liquidación operativa del transporte de caña de azúcar durante la zafra.

----

## 📌 Introducción y Contexto

Durante la temporada de zafra en la industria azucarera, la logística de transporte desde los frentes de cosecha (fincas) hasta las plantas de procesamiento (ingenios) es un proceso masivo y continuo. 

Históricamente, este flujo se ha documentado mediante "vales de báscula" en papel, lo que genera varios desafíos:
- **Pérdida de información** o errores en la carga manual de datos.
- **Demoras operativas** en el cálculo del peso neto real de la materia prima entregada.
- **Dificultad y retrasos** en la liquidación de los pagos (fletes) a los transportistas y choferes.
- **Falta de trazabilidad** exacta sobre el origen (finca/productor) y destino (ingenio) de cada viaje.

## 💡 Nuestra Propuesta (Objetivo del Sistema)

El **Sistema de Gestión Logística y Control de Fletes** tiene como propósito reemplazar el manejo manual por una solución centralizada y automatizada. El sistema registrará todo el circuito operativo de transporte, gestionando las entidades involucradas y calculando en tiempo real las métricas financieras y operativas sin almacenar datos redundantes.

### 🎯 ¿Qué permitirá hacer el sistema?

El alcance del proyecto contempla el desarrollo de los siguientes módulos funcionales:

1. **Gestión de Origen y Destino:**
   - Alta, baja y modificación de **Fincas** agrícolas y **Productores**.
   - Registro de los **Ingenios Azucareros** receptores de la carga.

2. **Administración de Flota y Personal:**
   - Control del parque automotor registrando los **Camiones** (por patente).
   - Gestión del padrón de **Choferes** habilitados y sus múltiples teléfonos de contacto (normalización de datos).

3. **Control Transaccional de Báscula (Viajes):**
   - Emisión digital del vale de transporte.
   - Registro del **Peso Bruto** (ingreso del camión cargado al ingenio).
   - Registro de la **Tara** (salida del camión vacío).

4. **Motor de Liquidación Automática:**
   - **Cálculo de Peso Neto:** Deducción automática de la carga real útil (Bruto - Tara).
   - **Liquidación de Fletes:** Cálculo dinámico del importe a abonar al transportista basado en la tarifa por tonelada pactada. *(Estos datos se calcularán "al vuelo" en la API, asegurando la integridad de la base de datos).*

---

## 🧱 Arquitectura y Stack Tecnológico Elegido

Para garantizar que la solución sea robusta, escalable y cumpla con estándares profesionales, el sistema se construirá utilizando las siguientes tecnologías:

- **Lenguaje:** Python (3.10+)
- **Framework Web:** FastAPI (Alta velocidad, asíncrono y tipado estático).
- **Base de Datos:** SQLite 3 (Modelo Relacional rigurosamente diseñado en Tercera Forma Normal - 3FN).
- **ORM:** SQLAlchemy 2.0 (Para la interacción segura con la base de datos).
- **Validación de Datos:** Pydantic v2 (Para la limpieza de datos de entrada y el cálculo de propiedades dinámicas como el monto del flete).
- **Autenticación:** JWT (PyJWT) con contraseñas hasheadas con Argon2 (pwdlib).
- **Documentación:** Swagger UI / ReDoc (Autogenerada por FastAPI).

---

## 🚀 Backend (API REST)

### Estructura

```
TFI/
├── backend/               # API REST (FastAPI + SQLite)
│   ├── app/
│   │   ├── main.py        # App FastAPI, CORS y registro de routers
│   │   ├── database.py    # Engine SQLite, sesión y PRAGMA foreign_keys
│   │   ├── models.py      # Modelos SQLAlchemy 2.0 (incluye USUARIOS)
│   │   ├── schemas.py     # Esquemas Pydantic v2
│   │   ├── auth.py        # JWT, hash de contraseñas y dependencias de rol
│   │   ├── seed_usuarios.py  # Crea las cuentas iniciales
│   │   ├── utils.py       # 404 y traducción de errores de integridad
│   │   └── routers/       # Un router por entidad (incluye auth y usuarios)
│   ├── tests/             # Pruebas de integración con pytest
│   ├── logistica_agro.sql # Esquema de la base
│   ├── seed.sql           # Datos de prueba
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── pyproject.toml     # Configuración de pytest y ruff
├── frontend/              # Interfaz web (a desarrollar)
├── Readme.md
└── .gitignore
```

### Puesta en marcha

```bash
cd backend
py -m venv .venv
.venv\Scripts\activate        # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed_usuarios   # primera vez: crea admin y usuarios chofer
uvicorn app.main:app --reload
```

- Swagger: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

La base se toma de `backend/logistica_agro.db`; se puede cambiar con la variable de entorno `DATABASE_URL` (por ejemplo `sqlite:///ruta/otra.db`).

### Roles y autenticación

El sistema tiene dos roles:

| Rol | Quién es | Permisos |
|---|---|---|
| `ADMIN` | Jefes / administración | Lee y escribe todos los catálogos, gestiona usuarios y puede crear, editar y eliminar cualquier viaje. |
| `CHOFER` | Choferes | Lee los catálogos necesarios. Solo puede registrar, ver y editar **sus propios** viajes (peso bruto, tara y tarifa). No puede eliminarlos ni ver los de otros choferes. |

El login usa el formulario OAuth2 estándar (`username` + `password`) y devuelve un token JWT que debe enviarse como `Authorization: Bearer <token>`.

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -d "username=admin&password=admin123"
```

**Cuentas iniciales** (creadas por `python -m app.seed_usuarios`):

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin123` | ADMIN |
| DNI de cada chofer (ej. `30111222`) | `chofer123` | CHOFER |

> ⚠️ Cambiar estas contraseñas antes de publicar. Además, definir `SECRET_KEY` por variable de entorno: sin ella se usa una clave de desarrollo conocida y los tokens dejan de ser seguros. La duración del token se configura con `ACCESS_TOKEN_EXPIRE_MINUTES` (por defecto 480 minutos).

Los endpoints de catálogo devuelven `401` sin token y `403` si el rol no tiene permiso. Un chofer que intenta acceder a un viaje ajeno recibe `404` (no se revela su existencia).

### Endpoints

| Recurso | Rutas | Rol |
|---|---|---|
| Login | `POST /api/v1/auth/login` | público |
| Usuario actual | `GET /api/v1/auth/me` | autenticado |
| Usuarios | `GET/POST /api/v1/usuarios`, `PUT /api/v1/usuarios/{id}` | ADMIN |
| Localidades | `GET/POST /api/v1/localidades`, `GET/PUT/DELETE /api/v1/localidades/{id}` | lectura: autenticado · escritura: ADMIN |
| Fincas | `GET/POST /api/v1/fincas`, `GET/PUT/DELETE /api/v1/fincas/{id}` | lectura: autenticado · escritura: ADMIN |
| Productores de una finca | `POST/DELETE /api/v1/fincas/{id}/productores/{cuit}` | ADMIN |
| Productores | `GET/POST /api/v1/productos`, `GET/PUT/DELETE /api/v1/productos/{cuit}` | lectura: autenticado · escritura: ADMIN |
| Camiones | `GET/POST /api/v1/camiones`, `GET/PUT/DELETE /api/v1/camiones/{patente}` | lectura: autenticado · escritura: ADMIN |
| Choferes | `GET/POST /api/v1/choferes`, `GET/PUT/DELETE /api/v1/choferes/{dni}` | lectura: autenticado · escritura: ADMIN |
| Ingenios | `GET/POST /api/v1/ingenios`, `GET/PUT/DELETE /api/v1/ingenios/{id}` | lectura: autenticado · escritura: ADMIN |
| Mis viajes | `GET /api/v1/viajes/mis-viajes` | CHOFER |
| Viajes | `GET/POST /api/v1/viajes`, `GET/PUT /api/v1/viajes/{id}` | autenticado (el chofer solo los propios) |
| Eliminar viaje | `DELETE /api/v1/viajes/{id}` | ADMIN |

`GET /api/v1/viajes` acepta los filtros `id_finca`, `id_ingenio`, `chofer_dni`, `camion_patente`, `producto_cuit`, `skip` y `limit`. Si quien consulta es un chofer, el filtro `chofer_dni` se fuerza a su propio DNI.

Cada viaje devuelve `peso_neto_kg` y `flete` calculados al vuelo (no se almacenan).

### Pruebas

```bash
cd backend
pip install -r requirements-dev.txt
pytest
ruff check app tests
```

---

## 👨‍💻 Acerca del Proyecto

Este sistema está siendo desarrollado como proyecto integrador para la asignatura **Programación IV** correspondiente a la **Tecnicatura Universitaria en Programación** dictada en la **Universidad Tecnológica Nacional (UTN)**.

- **Comisión:** C11
- **Equipo de Desarrollo:**
  - Rodríguez, Maximiliano
  - Ibarra, Santiago Luciano

---

## 🗄️ Base de Datos (SQLite)

El esquema está en `backend/logistica_agro.sql`, los datos de prueba en `backend/seed.sql` (idempotente) y la base lista para usar en `backend/logistica_agro.db` (no se versiona; está en `.gitignore`).

Si el archivo no existe, la API crea las tablas automáticamente al iniciar. Para regenerarla desde cero con los datos de prueba (ejecutar dentro de `backend/`):

```bash
cd backend
py -c "import sqlite3; c = sqlite3.connect('logistica_agro.db'); c.executescript(open('logistica_agro.sql', encoding='utf-8').read()); c.executescript(open('seed.sql', encoding='utf-8').read()); c.commit()"
```

Después de regenerar la base hay que crear las cuentas de acceso:

```bash
python -m app.seed_usuarios
```

El script incluye estas restricciones de integridad:

- FK compuesta `(ID_Finca, Producto_CUIT)` → `FINCA_PRODUCTO`, para que el productor del viaje esté asociado a la finca de origen.
- `Num_Vale` único (no se repite el vale de báscula).
- `CHECK` de `Peso_Bruto_Kg >= Tara_Kg`, `Tara_Kg >= 0` y `Tarifa_Ton >= 0`.
- `USUARIOS`: nombre de usuario único, `Rol` restringido a `ADMIN`/`CHOFER`, un solo usuario por chofer (`Chofer_DNI` único) y coherencia rol–chofer (un ADMIN no tiene DNI y un CHOFER sí).
- `LOCALIDADES`: `(Localidad_Nombre, Departamento)` único y `FINCAS.ID_Localidad` como FK. Así el departamento depende de la localidad y no se repite en cada finca (3FN estricta).

Una finca se crea indicando `id_localidad`; la respuesta incluye el objeto `localidad` con su nombre y departamento.

> ⚠️ SQLite no valida las claves foráneas por defecto. En cada conexión hay que ejecutar:
>
> ```sql
> PRAGMA foreign_keys = ON;
> ```
>
> Con SQLAlchemy se activa con un evento `connect`:
>
> ```python
> from sqlalchemy import event
>
> @event.listens_for(engine, "connect")
> def activar_fk(dbapi_connection, connection_record):
>     dbapi_connection.execute("PRAGMA foreign_keys = ON")
> ```
