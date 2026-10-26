# Prompt para construir el frontend — TFI Sistema de Gestión Logística y Control de Fletes

## 0. Tu tarea

Construí el **frontend completo** de este sistema dentro de la carpeta `frontend/` del repositorio. El backend y la base de datos **ya están terminados y funcionando**; tu trabajo es consumir esa API, no reimplementarla ni modificarla.

Entregá una aplicación funcional, prolija y responsive, con manejo de sesión, permisos por rol, formularios validados, tablas, filtros y mensajes de error claros.

Si algún detalle visual o de organización no está definido en este documento, tomá la decisión más razonable y documentala brevemente en `frontend/README.md`. No inventes endpoints, campos ni reglas de negocio que no estén descriptos acá.

**Restricciones importantes:**
- No modifiques nada dentro de `backend/`.
- No accedas directamente a SQLite desde el frontend.
- No agregues fechas, reportes ni campos que el backend no tenga.
- No cambies el contrato de la API. Si creés que falta algo, documentalo como propuesta, pero no lo implementes del lado del backend.

---

## 1. Contexto del proyecto

Es un TFI (Trabajo Final Integrador) para la digitalización del transporte de **caña de azúcar**. El sistema administra:

- Localidades y departamentos.
- Fincas y sus productores.
- Productores (identificados por CUIT).
- Camiones (identificados por patente).
- Choferes (identificados por DNI) y sus teléfonos.
- Ingenios (destinos de la caña).
- Viajes: el registro de cada flete, con peso bruto, tara, tarifa por tonelada, peso neto y flete calculados.
- Usuarios con dos roles: **ADMIN** (jefes/administración) y **CHOFER** (choferes).

El backend está hecho con **FastAPI + SQLAlchemy + Pydantic v2 + SQLite**. La autenticación es **JWT** con login por formulario OAuth2.

**Repositorio:**
- GitHub: `https://github.com/MaxiRodriguez47/TFI-Sistema-de-Gestion-Logistica-y-Control-de-Fletes-`
- Rama de trabajo: `Maxi_Rodriguez`
- Backend: `backend/`
- Frontend: `frontend/` (ahí va todo tu trabajo)

---

## 2. Stack recomendado

Usá:

- **React 18 + TypeScript + Vite**
- **React Router v6**
- **Axios** (o `fetch` con un wrapper propio)
- **TanStack Query** (recomendado para caché, loading y refetch) o hooks propios
- **React Hook Form + Zod** (recomendado) o validación manual
- **Tailwind CSS** o **Material UI** (elegí una y mantenela consistente)
- **Recharts** solo si hacés gráficos; no es obligatorio
- **Vitest + React Testing Library** para algunos tests básicos (opcional pero valorado)

Si preferís otro stack, podés usarlo siempre que respetes este contrato, la estructura por roles y los criterios de aceptación. La aplicación debe compilar con `npm run build`.

**Idioma de la interfaz:** español (Argentina).
**Moneda:** pesos argentinos (ARS), aunque el backend solo devuelve números.
**Unidades:** kilogramos (kg) y toneladas (t).

---

## 3. Estructura sugerida del frontend

```
frontend/
├── .env.example
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/
    │   ├── client.ts
    │   ├── auth.ts
    │   ├── localidades.ts
    │   ├── fincas.ts
    │   ├── productos.ts
    │   ├── camiones.ts
    │   ├── choferes.ts
    │   ├── ingenios.ts
    │   ├── viajes.ts
    │   └── usuarios.ts
    ├── auth/
    │   ├── AuthContext.tsx
    │   ├── useAuth.ts
    │   └── ProtectedRoute.tsx
    ├── components/
    │   ├── Layout.tsx
    │   ├── Sidebar.tsx
    │   ├── DataTable.tsx
    │   ├── Pagination.tsx
    │   ├── ConfirmDialog.tsx
    │   ├── ErrorMessage.tsx
    │   ├── Loading.tsx
    │   ├── EmptyState.tsx
    │   └── FormField.tsx
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── NotFoundPage.tsx
    │   ├── admin/
    │   │   ├── DashboardPage.tsx
    │   │   ├── ViajesPage.tsx
    │   │   ├── ViajeFormPage.tsx
    │   │   ├── LocalidadesPage.tsx
    │   │   ├── FincasPage.tsx
    │   │   ├── ProductoresPage.tsx
    │   │   ├── CamionesPage.tsx
    │   │   ├── ChoferesPage.tsx
    │   │   ├── IngeniosPage.tsx
    │   │   └── UsuariosPage.tsx
    │   └── chofer/
    │       ├── MisViajesPage.tsx
    │       ├── NuevoViajePage.tsx
    │       └── PerfilPage.tsx
    ├── routes/
    │   └── AppRoutes.tsx
    ├── types/
    │   └── api.ts
    └── utils/
        ├── format.ts
        └── errors.ts
```

No es obligatorio que los nombres sean exactamente estos, pero la separación por responsabilidades sí.

---

## 4. Cómo levantar el backend

El frontend debe apuntar a:

```
http://127.0.0.1:8000/api/v1
```

Documentación interactiva (Swagger):

```
http://127.0.0.1:8000/docs
```

Health check:

```
GET http://127.0.0.1:8000/health
```

### 4.1. Instalación y arranque

Desde la raíz del repositorio:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Si el entorno virtual ya existe, alcanza con activarlo y ejecutar `uvicorn app.main:app --reload`.

### 4.2. Base de datos

La base es SQLite y el archivo es `backend/logistica_agro.db`. Está en `.gitignore`, así que puede no existir al clonar.

Para regenerarla desde cero:

```powershell
cd backend
.\.venv\Scripts\python.exe -c "import sqlite3, pathlib; c = sqlite3.connect('logistica_agro.db'); c.executescript(pathlib.Path('logistica_agro.sql').read_text(encoding='utf-8')); c.executescript(pathlib.Path('seed.sql').read_text(encoding='utf-8')); c.commit(); c.close()"
.\.venv\Scripts\python.exe -m app.seed_usuarios
```

Eso crea las tablas, carga los datos de prueba y genera las cuentas iniciales.

Si el backend responde `no such table`, faltó ejecutar los scripts SQL. Si el login devuelve `401`, faltó ejecutar `python -m app.seed_usuarios`.

### 4.3. Variables de entorno del backend

No son necesarias para desarrollo, pero existen:

- `DATABASE_URL`: por defecto `sqlite:///backend/logistica_agro.db`.
- `SECRET_KEY`: clave de firma JWT. En producción debe cambiarse.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: por defecto `480` (8 horas).

---

## 5. Autenticación y sesión

### 5.1. Login

```
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded
```

**Importante:** no es JSON. Es `application/x-www-form-urlencoded` con exactamente estos campos:

```
username=admin&password=admin123
```

Respuesta `200`:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "rol": "ADMIN",
  "chofer_dni": null,
  "nombre": "admin"
}
```

Para un chofer:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "rol": "CHOFER",
  "chofer_dni": "30111222",
  "nombre": "Gómez, Luis"
}
```

- `username` es el nombre de usuario, no el DNI (aunque en los choferes de prueba coincida con el DNI).
- El token dura 480 minutos.
- Guardalo en `localStorage` (o `sessionStorage`) bajo una clave propia, por ejemplo `tfi_token`.
- Guardá también `rol`, `chofer_dni` y `nombre` para la UI, pero **el rol confiable para permisos siempre debe venir del backend**; la UI solo oculta opciones.

### 5.2. Uso del token

En cada request autenticado:

```
Authorization: Bearer <access_token>
```

### 5.3. Usuario actual

```
GET /api/v1/auth/me
```

Respuesta `200`:

```json
{
  "id_usuario": 1,
  "usuario_nombre": "admin",
  "rol": "ADMIN",
  "chofer_dni": null,
  "activo": true,
  "chofer_nombre": null
}
```

Para un chofer, `chofer_dni` y `chofer_nombre` vienen completos.

### 5.4. Manejo de sesión en el frontend

- Al iniciar, si hay token guardado, llamá a `GET /auth/me` para restaurar la sesión.
- Si `/auth/me` devuelve `401`, limpiá el token y redirigí a `/login`.
- Si el login devuelve `401`, mostrá “Usuario o contraseña incorrectos”.
- Si devuelve `403` con “El usuario está desactivado”, mostralo tal cual.
- Cualquier `401` posterior en un request debe cerrar sesión y redirigir a `/login` con un mensaje de sesión expirada.
- El logout es local: borrá token y datos de usuario.
- No muestres el token en la UI ni lo pongas en la URL.

### 5.5. Ruteo por rol

- `/login`: pública.
- Si el usuario es `ADMIN`, redirigir a `/admin`.
- Si el usuario es `CHOFER`, redirigir a `/mis-viajes`.
- Si un `CHOFER` intenta entrar a una ruta `/admin/*`, redirigir a `/mis-viajes`.
- Si un `ADMIN` intenta entrar a una ruta exclusiva de chofer, redirigir a `/admin`.
- Ruta desconocida: página 404 con link al inicio según el rol.

---

## 6. Permisos por rol

| Recurso | ADMIN | CHOFER |
|---|---|---|
| Localidades | Leer, crear, editar, eliminar | Solo leer |
| Fincas | Leer, crear, editar, eliminar, asociar/desasociar productores | Solo leer |
| Productores | Leer, crear, editar, eliminar | Solo leer |
| Camiones | Leer, crear, eliminar (no hay edición real) | Solo leer |
| Choferes | Leer, crear, editar, eliminar | Solo leer |
| Ingenios | Leer, crear, editar, eliminar | Solo leer |
| Viajes | Leer todos, crear para cualquier chofer, editar cualquiera, eliminar | Leer solo los propios, crear solo a su nombre, editar solo los propios, **no eliminar** |
| Usuarios | Leer, crear, cambiar contraseña, activar/desactivar | Sin acceso |

Reglas adicionales del backend:

- Un chofer que intenta ver o editar el viaje de otro recibe **404** (no 403), para no revelar que existe.
- En `GET /viajes`, si un chofer manda `chofer_dni` de otro, el backend ignora el filtro y fuerza su propio DNI.
- En `POST /viajes`, un chofer que manda un `chofer_dni` distinto al suyo recibe **403**.
- En `PUT /viajes/{id}`, un chofer no puede reasignar el viaje a otro chofer (**403**).
- `DELETE /viajes/{id}` es solo **ADMIN**.
- `GET /viajes/mis-viajes` es solo **CHOFER**; un ADMIN recibe **403**.
- La UI debe ocultar acciones no permitidas, pero el backend siempre valida.

---

## 7. Contrato de la API

### 7.1. Convenciones generales

- Base: `http://127.0.0.1:8000/api/v1`
- Todas las rutas de abajo son relativas a esa base.
- No usar barra final: `GET /fincas`, no `GET /fincas/`.
- JSON en requests y responses, **excepto el login**, que es form-urlencoded.
- Los decimales se devuelven como **números JSON**, no como strings. Ejemplo: `32500.0`, no `"32500.00"`.
- Los `DELETE` exitosos devuelven **204 No Content** sin body.
- Los `POST` exitosos devuelven **201 Created**.
- Los `PUT` son de **reemplazo completo**, salvo `PUT /usuarios/{id}` que es parcial.
- Paginación: `skip` (desde 0, default 0) y `limit` (1 a 500, default 100).
- Los errores tienen forma `{"detail": "mensaje"}`.
- Los errores de validación de Pydantic tienen `detail` como **array** de objetos con `loc`, `msg`, `type`.
- Fechas: **no existen** en ningún modelo. No hay campo de fecha de viaje ni filtros por fecha.

### 7.2. Autenticación

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Público | Login form-urlencoded |
| GET | `/auth/me` | Autenticado | Datos del usuario actual |

### 7.3. Localidades

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/localidades` | Autenticado | Listar |
| GET | `/localidades/{id_localidad}` | Autenticado | Obtener una |
| POST | `/localidades` | ADMIN | Crear |
| PUT | `/localidades/{id_localidad}` | ADMIN | Actualizar |
| DELETE | `/localidades/{id_localidad}` | ADMIN | Eliminar |

Body de creación/actualización:

```json
{
  "localidad_nombre": "Concepción",
  "departamento": "Chicligasta"
}
```

Validaciones:
- `localidad_nombre`: 1 a 100 caracteres.
- `departamento`: 1 a 100 caracteres.
- La combinación `(localidad_nombre, departamento)` es única. Si se repite: **409**.

Respuesta (`LocalidadRead`):

```json
{
  "id_localidad": 1,
  "localidad_nombre": "Concepción",
  "departamento": "Chicligasta",
  "fincas": [
    { "id_finca": 1, "finca_nombre": "La Esperanza" }
  ]
}
```

- `DELETE` devuelve **409** si la localidad tiene fincas asociadas.
- No se puede eliminar una localidad en uso.

### 7.4. Fincas

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/fincas` | Autenticado | Listar |
| GET | `/fincas/{id_finca}` | Autenticado | Obtener una |
| POST | `/fincas` | ADMIN | Crear |
| PUT | `/fincas/{id_finca}` | ADMIN | Actualizar |
| DELETE | `/fincas/{id_finca}` | ADMIN | Eliminar |
| POST | `/fincas/{id_finca}/productores/{producto_cuit}` | ADMIN | Asociar productor |
| DELETE | `/fincas/{id_finca}/productores/{producto_cuit}` | ADMIN | Desasociar productor |

Body de creación/actualización:

```json
{
  "finca_nombre": "La Esperanza",
  "id_localidad": 1
}
```

Validaciones:
- `finca_nombre`: 1 a 100 caracteres.
- `id_localidad`: entero > 0 y debe existir. Si no existe: **404**.
- No se envía `localidad` ni `departamento`; eso vive en `LOCALIDADES`.

Respuesta (`FincaRead`):

```json
{
  "id_finca": 1,
  "finca_nombre": "La Esperanza",
  "id_localidad": 1,
  "localidad": {
    "id_localidad": 1,
    "localidad_nombre": "Concepción",
    "departamento": "Chicligasta"
  },
  "productores": [
    {
      "producto_cuit": "20-12345678-3",
      "producto_nombre": "Pérez, Juan"
    }
  ]
}
```

Asociación de productores:
- `POST` es idempotente: si ya estaba asociado, devuelve la finca sin error.
- `DELETE` devuelve **404** si el productor no estaba asociado.
- Ambos devuelven la finca completa actualizada.
- El productor de un viaje **debe** estar asociado a la finca de origen; el backend lo valida con **400**.

### 7.5. Productores

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/productos` | Autenticado | Listar |
| GET | `/productos/{producto_cuit}` | Autenticado | Obtener uno |
| POST | `/productos` | ADMIN | Crear |
| PUT | `/productos/{producto_cuit}` | ADMIN | Actualizar |
| DELETE | `/productos/{producto_cuit}` | ADMIN | Eliminar |

Body:

```json
{
  "producto_cuit": "20-12345678-3",
  "producto_nombre": "Pérez, Juan"
}
```

Validaciones:
- `producto_cuit`: 1 a 20 caracteres; es la PK.
- `producto_nombre`: 1 a 100 caracteres.
- En `PUT`, el CUIT del body debe coincidir con el de la URL; si no: **400** “No se puede modificar el CUIT del productor”.

Respuesta (`ProductoRead`):

```json
{
  "producto_cuit": "20-12345678-3",
  "producto_nombre": "Pérez, Juan",
  "fincas": [
    { "id_finca": 1, "finca_nombre": "La Esperanza" }
  ]
}
```

- `DELETE` devuelve **409** si el productor tiene viajes asociados.

### 7.6. Camiones

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/camiones` | Autenticado | Listar |
| GET | `/camiones/{camion_patente}` | Autenticado | Obtener uno |
| POST | `/camiones` | ADMIN | Crear |
| PUT | `/camiones/{camion_patente}` | ADMIN | Actualizar |
| DELETE | `/camiones/{camion_patente}` | ADMIN | Eliminar |

Body:

```json
{
  "camion_patente": "AB123CD"
}
```

Validaciones:
- `camion_patente`: 6 a 10 caracteres.
- Se normaliza a mayúsculas y se recorta automáticamente.
- En `PUT`, la patente del body debe coincidir con la de la URL; si no: **400**.
- Como la patente es la única propiedad, **no hay nada editable**. En la UI alcanza con listar, crear y eliminar; el `PUT` existe pero es un no-op validado.

Respuesta (`CamionRead`):

```json
{ "camion_patente": "AB123CD" }
```

- `DELETE` devuelve **409** si el camión tiene viajes asociados.

### 7.7. Choferes

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/choferes` | Autenticado | Listar |
| GET | `/choferes/{chofer_dni}` | Autenticado | Obtener uno |
| POST | `/choferes` | ADMIN | Crear |
| PUT | `/choferes/{chofer_dni}` | ADMIN | Actualizar |
| DELETE | `/choferes/{chofer_dni}` | ADMIN | Eliminar |

Body:

```json
{
  "chofer_dni": "30111222",
  "chofer_nombre": "Gómez, Luis",
  "telefonos": ["3865400001", "3865400002"]
}
```

Validaciones:
- `chofer_dni`: solo dígitos, 6 a 20 caracteres; es la PK.
- `chofer_nombre`: 1 a 100 caracteres.
- `telefonos`: lista de strings de 6 a 20 caracteres, solo `0-9`, `+`, `-` y espacios. No se permiten duplicados.
- En `PUT`, el DNI del body debe coincidir con el de la URL; si no: **400**.
- En `PUT`, la lista de teléfonos **reemplaza** a la anterior: los que no vienen se eliminan y los nuevos se agregan.

Respuesta (`ChoferRead`):

```json
{
  "chofer_dni": "30111222",
  "chofer_nombre": "Gómez, Luis",
  "telefonos": ["3865400001", "3865400002"]
}
```

- `DELETE` devuelve **409** si el chofer tiene viajes asociados.
- Si el chofer tiene un usuario vinculado, la FK de `USUARIOS` es `ON DELETE CASCADE`; la UI igualmente debe tratar el 409 por viajes.

### 7.8. Ingenios

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/ingenios` | Autenticado | Listar |
| GET | `/ingenios/{id_ingenio}` | Autenticado | Obtener uno |
| POST | `/ingenios` | ADMIN | Crear |
| PUT | `/ingenios/{id_ingenio}` | ADMIN | Actualizar |
| DELETE | `/ingenios/{id_ingenio}` | ADMIN | Eliminar |

Body:

```json
{ "ingenio_nombre": "Ingenio Concepción" }
```

Validaciones:
- `ingenio_nombre`: 1 a 100 caracteres y único. Si se repite: **409**.

Respuesta (`IngenioRead`):

```json
{
  "id_ingenio": 1,
  "ingenio_nombre": "Ingenio Concepción"
}
```

- `DELETE` devuelve **409** si el ingenio tiene viajes asociados.

### 7.9. Viajes

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/viajes` | Autenticado | Listar con filtros |
| GET | `/viajes/mis-viajes` | CHOFER | Viajes del chofer autenticado |
| GET | `/viajes/{id_viaje}` | Autenticado | Obtener uno |
| POST | `/viajes` | Autenticado (ADMIN o CHOFER) | Registrar |
| PUT | `/viajes/{id_viaje}` | Autenticado (ADMIN o dueño) | Actualizar |
| DELETE | `/viajes/{id_viaje}` | ADMIN | Eliminar |

#### Filtros de `GET /viajes`

Query params opcionales:

- `id_finca` (int)
- `id_ingenio` (int)
- `chofer_dni` (string)
- `camion_patente` (string; el backend lo pasa a mayúsculas)
- `producto_cuit` (string)
- `skip` (int, default 0)
- `limit` (int, 1 a 500, default 100)

Si el usuario es `CHOFER`, el backend **ignora** cualquier `chofer_dni` enviado y filtra por el DNI del token.

Orden: por `id_viaje` ascendente (orden lexicográfico del string, no cronológico).

#### `GET /viajes/mis-viajes`

Solo `CHOFER`. Acepta `skip` y `limit`. Devuelve los viajes cuyo `chofer_dni` coincide con el usuario autenticado.

Un `ADMIN` recibe **403**.

#### Body de `POST /viajes`

```json
{
  "id_viaje": "V009",
  "id_finca": 1,
  "producto_cuit": "20-12345678-3",
  "camion_patente": "AB123CD",
  "chofer_dni": "30111222",
  "id_ingenio": 1,
  "num_vale": "VAL-009",
  "peso_bruto_kg": 32500,
  "tara_kg": 12000,
  "tarifa_ton": 8500
}
```

**Muy importante:** `id_viaje` lo provee el cliente. No existe endpoint de autogeneración ni campo autoincremental. En el alta, el usuario debe escribir el ID (por ejemplo `V009`) y el número de vale (por ejemplo `VAL-009`). Podés sugerir un valor basado en los viajes visibles, pero siempre debe ser editable.

#### Body de `PUT /viajes/{id_viaje}`

Igual que el de creación, **sin `id_viaje`** (el ID va en la URL):

```json
{
  "id_finca": 1,
  "producto_cuit": "20-12345678-3",
  "camion_patente": "AB123CD",
  "chofer_dni": "30111222",
  "id_ingenio": 1,
  "num_vale": "VAL-009",
  "peso_bruto_kg": 32500,
  "tara_kg": 12000,
  "tarifa_ton": 8500
}
```

Es un reemplazo completo: hay que enviar **todos** los campos, no solo los modificados.

#### Validaciones de viajes

- `id_viaje`: 1 a 20 caracteres; único. Si ya existe: **409**.
- `num_vale`: 1 a 20 caracteres; único global. Si ya existe: **409**.
- `id_finca`: > 0 y existente; si no: **404**.
- `producto_cuit`: existente; si no: **404**.
- `camion_patente`: 6 a 10 caracteres, se normaliza a mayúsculas; debe existir; si no: **404**.
- `chofer_dni`: solo dígitos, 6 a 20; debe existir; si no: **404**.
- `id_ingenio`: > 0 y existente; si no: **404**.
- El productor debe estar asociado a la finca: si no, **400** “El productor indicado no está asociado a la finca de origen”.
- `peso_bruto_kg`, `tara_kg`, `tarifa_ton`: números >= 0, hasta 2 decimales y 10 dígitos en total.
- `peso_bruto_kg >= tara_kg`; si no: **422**.
- Un chofer solo puede crear/editar viajes con su propio `chofer_dni`; si no: **403**.

#### Respuesta (`ViajeRead`)

```json
{
  "id_viaje": "V001",
  "id_finca": 1,
  "producto_cuit": "20-12345678-3",
  "camion_patente": "AB123CD",
  "chofer_dni": "30111222",
  "id_ingenio": 1,
  "num_vale": "VAL-001",
  "peso_bruto_kg": 32500.0,
  "tara_kg": 12000.0,
  "tarifa_ton": 8500.0,
  "peso_neto_kg": 20500.0,
  "flete": 174250.0,
  "finca": {
    "id_finca": 1,
    "finca_nombre": "La Esperanza"
  },
  "producto": {
    "producto_cuit": "20-12345678-3",
    "producto_nombre": "Pérez, Juan"
  },
  "camion": {
    "camion_patente": "AB123CD"
  },
  "chofer": {
    "chofer_dni": "30111222",
    "chofer_nombre": "Gómez, Luis"
  },
  "ingenio": {
    "id_ingenio": 1,
    "ingenio_nombre": "Ingenio Concepción"
  }
}
```

**Ojo:** el objeto `finca` del viaje solo trae `id_finca` y `finca_nombre`. No trae localidad ni departamento. Si querés mostrarlos en la tabla de viajes, precargá las fincas desde `GET /fincas` y cruzalos por `id_finca`, o consultá `GET /fincas/{id}`.

#### Reglas de edición y borrado

- `PUT`: un chofer solo puede editar sus propios viajes. Si intenta editar el de otro: **404**.
- `PUT`: un chofer no puede cambiar `chofer_dni` a otro; si lo intenta: **403**.
- `DELETE`: solo `ADMIN`. Un chofer recibe **403**.
- No hay borrado lógico de viajes.

### 7.10. Usuarios

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| GET | `/usuarios` | ADMIN | Listar |
| POST | `/usuarios` | ADMIN | Crear |
| PUT | `/usuarios/{id_usuario}` | ADMIN | Cambiar contraseña y/o estado |

**No existe `DELETE /usuarios`.** La baja se hace con `activo: false`.

Body de creación:

```json
{
  "usuario_nombre": "nuevo.chofer",
  "password": "claveSegura123",
  "rol": "CHOFER",
  "chofer_dni": "30111222"
}
```

Para un administrador:

```json
{
  "usuario_nombre": "jefe2",
  "password": "claveSegura123",
  "rol": "ADMIN"
}
```

Validaciones:
- `usuario_nombre`: 3 a 50 caracteres; único. Si se repite: **409**.
- `password`: 8 a 128 caracteres.
- `rol`: `"ADMIN"` o `"CHOFER"`.
- Si `rol = "CHOFER"`, `chofer_dni` es obligatorio, debe existir (**404** si no) y ese chofer no debe tener ya un usuario (**409**).
- Si `rol = "ADMIN"`, `chofer_dni` debe omitirse o ser `null`.
- `PUT /usuarios/{id_usuario}` es **parcial**:

```json
{
  "password": "nuevaClave123",
  "activo": false
}
```

Ambos campos son opcionales. No se puede cambiar `usuario_nombre`, `rol` ni `chofer_dni` por este endpoint.
- Un admin no puede desactivar su propia cuenta: **400** “No puede desactivar su propio usuario”.

Respuesta (`UsuarioRead`):

```json
{
  "id_usuario": 1,
  "usuario_nombre": "admin",
  "rol": "ADMIN",
  "chofer_dni": null,
  "activo": true,
  "chofer_nombre": null
}
```

Para un chofer, `chofer_nombre` viene con el nombre del chofer vinculado.

---

## 8. Modelo de datos (SQLite, 3FN estricta)

El frontend no accede a la base, pero necesitás entender el modelo para construir formularios y mostrar datos.

### 8.1. Tablas

| Tabla | Clave primaria | Columnas | Relaciones / restricciones |
|---|---|---|---|
| `LOCALIDADES` | `ID_Localidad` autoincremental | `Localidad_Nombre`, `Departamento` | `UNIQUE (Localidad_Nombre, Departamento)` |
| `FINCAS` | `ID_Finca` autoincremental | `Finca_Nombre`, `ID_Localidad` | FK a `LOCALIDADES` |
| `PRODUCTOS` | `Producto_CUIT` | `Producto_Nombre` | — |
| `FINCA_PRODUCTO` | `(ID_Finca, Producto_CUIT)` | — | FKs a `FINCAS` y `PRODUCTOS`, `ON DELETE CASCADE` |
| `CAMIONES` | `Camion_Patente` | — | — |
| `CHOFERES` | `Chofer_DNI` | `Chofer_Nombre` | — |
| `TELEFONOS_CHOFER` | `(Chofer_DNI, Telefono)` | `Telefono` | FK a `CHOFERES`, `ON DELETE CASCADE` |
| `INGENIOS` | `ID_Ingenio` autoincremental | `Ingenio_Nombre` | `UNIQUE` |
| `VIAJES` | `ID_Viaje` (string) | `ID_Finca`, `Producto_CUIT`, `Camion_Patente`, `Chofer_DNI`, `ID_Ingenio`, `Num_Vale`, `Peso_Bruto_Kg`, `Tara_Kg`, `Tarifa_Ton` | FKs a las tablas anteriores; `Num_Vale` único; checks de pesos/tarifa; FK compuesta a `FINCA_PRODUCTO` |
| `USUARIOS` | `ID_Usuario` autoincremental | `Usuario_Nombre`, `Password_Hash`, `Rol`, `Chofer_DNI`, `Activo` | `Usuario_Nombre` único; `Chofer_DNI` único y nullable; `CHECK` de rol y coherencia rol–chofer; FK a `CHOFERES` |

### 8.2. Restricciones de `VIAJES`

- `CHECK (Peso_Bruto_Kg >= Tara_Kg)`
- `CHECK (Tara_Kg >= 0)`
- `CHECK (Tarifa_Ton >= 0)`
- `Num_Vale` es `UNIQUE`.
- La FK compuesta `(ID_Finca, Producto_CUIT)` referencia `FINCA_PRODUCTO`, lo que garantiza que el productor esté asociado a la finca.

### 8.3. Restricciones de `USUARIOS`

- `Usuario_Nombre` es único.
- `Rol` solo puede ser `ADMIN` o `CHOFER`.
- `(Rol = 'ADMIN' AND Chofer_DNI IS NULL) OR (Rol = 'CHOFER' AND Chofer_DNI IS NOT NULL)`.
- `Chofer_DNI` es único: un chofer no puede tener más de una cuenta.
- `Activo` es booleano, por defecto `1`.

### 8.4. Por qué es 3FN

- `LOCALIDADES` evita la dependencia transitiva `ID_Finca → Localidad → Departamento`. La finca solo referencia `ID_Localidad` y el departamento depende de la localidad.
- Los campos derivados `peso_neto_kg` y `flete` **no se almacenan**; se calculan en el backend al leer.
- `Tarifa_Ton` sí se guarda en `VIAJES` como **snapshot histórico** de la tarifa pactada para ese viaje; no es redundancia.
- `FINCA_PRODUCTO` resuelve la relación N:M sin duplicar datos.
- `TELEFONOS_CHOFER` resuelve el atributo multivaluado.

---

## 9. Campos calculados y reglas de negocio

El backend calcula y devuelve:

```
peso_neto_kg = peso_bruto_kg - tara_kg
flete = round((peso_neto_kg / 1000) * tarifa_ton, 2)
```

Redondeo: `ROUND_HALF_UP` a 2 decimales.

Ejemplo:

```
bruto = 32.500 kg
tara  = 12.000 kg
neto  = 20.500 kg = 20,5 t
tarifa = 8.500 $/t
flete = 20,5 * 8.500 = 174.250,00 $
```

Reglas:
- `peso_neto_kg` y `flete` son **solo lectura**. No se envían en `POST` ni `PUT`.
- El usuario no puede editar el neto ni el flete directamente.
- En el formulario, mostrá una **previsualización en vivo** del neto y del flete mientras se cargan bruto, tara y tarifa.
- Si `peso_bruto_kg < tara_kg`, mostrá el error antes de enviar y también manejá el **422** del backend.
- La tarifa es **por tonelada**, no por viaje ni por kg.
- No hay tabla de tarifas ni endpoint de tarifas: la tarifa se carga manualmente en cada viaje.
- No hay campo de fecha. No agregues “fecha de viaje”, filtros por fecha ni gráficos temporales.
- No hay estado del viaje (pendiente, entregado, etc.). No lo inventes.

---

## 10. Errores y mensajes

Manejá estos códigos de forma centralizada:

| Código | Significado | Acción en la UI |
|---|---|---|
| `400` | Regla de negocio | Mostrar `detail` tal cual |
| `401` | No autenticado o token inválido | Cerrar sesión y redirigir a login |
| `403` | Sin permisos o usuario desactivado | Mostrar `detail`; si es desactivado, cerrar sesión |
| `404` | No encontrado | Mostrar “No encontrado” o `detail` |
| `409` | Conflicto (duplicado, FK en uso) | Mostrar `detail` |
| `422` | Validación | Mostrar errores por campo si `detail` es array; si es string, mostrarlo |
| `500` | Error del servidor | Mensaje genérico “Ocurrió un error inesperado” |

Ejemplos de `detail`:

```json
{ "detail": "Ya existe un viaje con ese ID o ese número de vale" }
```

```json
{
  "detail": [
    {
      "loc": ["body", "peso_bruto_kg"],
      "msg": "Input should be greater than or equal to 0",
      "type": "greater_than_equal"
    }
  ]
}
```

Requisitos:
- Nunca muestres un error crudo de Axios ni un `[object Object]`.
- Extraé siempre `error.response.data.detail`.
- Para arrays de validación, mapeá `loc` al nombre del campo y mostrá el mensaje debajo del input.
- Los errores de red deben mostrar “No se pudo conectar con el servidor”.
- Usá toasts o alerts no bloqueantes para errores generales, y mensajes inline para errores de formulario.
- Confirmá antes de eliminar cualquier registro.
- Si un `DELETE` devuelve `409`, explicá que el registro está en uso y no lo elimines de la tabla.

---

## 11. Pantallas y flujos

### 11.1. Login (`/login`)

- Formulario con usuario y contraseña.
- Mostrar/ocultar contraseña.
- Botón “Ingresar” con estado de carga.
- Mensaje de error claro.
- No permitir enviar vacío.
- Al success, guardar sesión y redirigir según rol.
- Diseño centrado, limpio, con el nombre del sistema.
- Mostrar un texto discreto con las cuentas de prueba solo en desarrollo (opcional).

### 11.2. Layout general

**ADMIN:**
- Sidebar o barra lateral con:
  - Dashboard
  - Viajes
  - Localidades
  - Fincas
  - Productores
  - Camiones
  - Choferes
  - Ingenios
  - Usuarios
- Header con nombre del usuario, rol y botón “Cerrar sesión”.
- En mobile, menú colapsable.

**CHOFER:**
- Navegación simple, mobile-first:
  - Mis viajes
  - Nuevo viaje
  - Mi perfil
- Header con nombre del chofer y logout.
- No mostrar ninguna opción de administración.

### 11.3. Dashboard del ADMIN (`/admin`)

No hay endpoint de estadísticas: calculalas en el cliente a partir de `GET /viajes?limit=500`.

Mostrar como mínimo:
- Total de viajes.
- Total de kg netos transportados.
- Total de fletes ($).
- Cantidad de choferes, camiones, fincas e ingenios (desde sus endpoints).
- Distribución de kg netos o fletes por ingenio.
- Distribución por finca.
- Ranking de choferes por kg netos o flete.
- Accesos rápidos a “Nuevo viaje” y a los catálogos.

Aclaraciones:
- No hay fechas, así que no hagas gráficos por mes ni “últimos 30 días”.
- Si hay más de 500 viajes, la suma con `limit=500` será parcial. Podés paginar y sumar todas las páginas, o aclarar que el tablero usa hasta 500 viajes. Para el TFI alcanza con paginar todas las páginas.
- Ordená los listados por `id_viaje` si no hay otro criterio.

### 11.4. Viajes del ADMIN (`/admin/viajes`)

- Tabla con columnas:
  - ID viaje
  - N° vale
  - Finca
  - Productor
  - Ingenio
  - Camión
  - Chofer
  - Peso bruto (kg)
  - Tara (kg)
  - Peso neto (kg)
  - Tarifa ($/t)
  - Flete ($)
  - Acciones (ver, editar, eliminar)
- Filtros por:
  - Finca
  - Ingenio
  - Chofer
  - Camión
  - Productor
- Búsqueda por ID o vale (si la hacés client-side, aclaralo; el backend no tiene búsqueda textual).
- Paginación server-side con `skip`/`limit`.
- Botón “Nuevo viaje”.
- Confirmación antes de eliminar.
- Si no hay resultados, mostrar un estado vacío claro.

### 11.5. Alta/edición de viaje del ADMIN (`/admin/viajes/nuevo`, `/admin/viajes/:id`)

Formulario:
- `id_viaje`: solo en alta; texto; editable; no autogenerar a ciegas.
- `num_vale`: texto; editable.
- Finca: select desde `GET /fincas`.
- Productor: select filtrado a `finca.productores`. Al cambiar de finca, limpiar el productor si ya no pertenece.
- Camión: select desde `GET /camiones`.
- Chofer: select desde `GET /choferes` (el admin puede elegir cualquiera).
- Ingenio: select desde `GET /ingenios`.
- Peso bruto (kg): numérico, 2 decimales.
- Tara (kg): numérico, 2 decimales.
- Tarifa ($/t): numérico, 2 decimales.
- Peso neto y flete: solo lectura, calculados en vivo.
- Botones “Guardar” y “Cancelar”.

En edición:
- `id_viaje` no se edita.
- Todos los demás campos se envían completos en el `PUT`.
- El admin puede cambiar el chofer.
- Mostrar botón “Eliminar” solo si estás en edición y sos ADMIN.

### 11.6. Catálogos del ADMIN

Para cada catálogo: listado, alta, edición y baja con confirmación. Usá modales o páginas dedicadas, pero mantené el mismo patrón.

**Localidades**
- Columnas: ID, localidad, departamento, cantidad de fincas.
- Crear/editar: `localidad_nombre`, `departamento`.
- Eliminar: si tiene fincas, el backend devuelve **409**; mostrar el mensaje.
- No permitir duplicar la misma combinación localidad/departamento.

**Fincas**
- Columnas: ID, nombre, localidad, departamento, productores.
- Crear/editar: `finca_nombre`, `id_localidad`.
- Select de localidad con formato “Localidad — Departamento”.
- Si no hay localidades, mostrar un aviso con link a “Localidades”.
- Gestión de productores:
  - Ver los asociados como chips o lista.
  - Agregar productor con `POST /fincas/{id}/productores/{cuit}`.
  - Quitar productor con `DELETE /fincas/{id}/productores/{cuit}`.
  - El selector de productores para agregar debe excluir los ya asociados.
- Eliminar finca: **409** si tiene viajes.

**Productores**
- Columnas: CUIT, nombre, fincas asociadas.
- Crear/editar: `producto_cuit`, `producto_nombre`.
- En edición, el CUIT es solo lectura.
- Eliminar: **409** si tiene viajes.

**Camiones**
- Columnas: patente.
- Crear: `camion_patente`, en mayúsculas.
- No hay edición real; podés omitir el botón “Editar”.
- Eliminar: **409** si tiene viajes.

**Choferes**
- Columnas: DNI, nombre, teléfonos.
- Crear/editar: `chofer_dni`, `chofer_nombre`, `telefonos` (lista editable de teléfonos).
- En edición, el DNI es solo lectura.
- Permitir agregar/quitar teléfonos dinámicamente.
- Validar que no haya teléfonos duplicados.
- Eliminar: **409** si tiene viajes.

**Ingenios**
- Columnas: ID, nombre.
- Crear/editar: `ingenio_nombre`.
- Eliminar: **409** si tiene viajes.

**Usuarios**
- Columnas: usuario, rol, chofer vinculado, estado (activo/inactivo).
- Crear:
  - Elegir rol.
  - Si es `CHOFER`, mostrar select de choferes **sin usuario asignado** y exigir DNI.
  - Si es `ADMIN`, ocultar el select de chofer.
  - Contraseña de al menos 8 caracteres.
- Editar:
  - Solo contraseña y estado.
  - No permitir cambiar usuario, rol ni chofer.
  - No permitir desactivar la propia cuenta (deshabilitar el toggle).
- No mostrar botón “Eliminar”.
- Mostrar claramente que “desactivar” equivale a dar de baja.

### 11.7. Pantallas del CHOFER

**Mis viajes (`/mis-viajes`)**
- Usar `GET /viajes/mis-viajes`.
- Mostrar tarjetas o tabla adaptada a mobile:
  - ID viaje
  - N° vale
  - Finca
  - Productor
  - Ingenio
  - Camión
  - Peso neto
  - Flete
- Acciones: ver detalle, editar.
- **No mostrar eliminar.**
- Estado vacío: “Todavía no registraste viajes” + botón “Registrar mi primer viaje”.

**Nuevo viaje (`/mis-viajes/nuevo`)**
- Mismos campos que el alta del admin, excepto chofer:
  - El chofer autenticado se muestra como dato fijo (nombre y DNI), no editable.
  - El `chofer_dni` enviado debe ser el del token.
- Selects de finca, productor filtrado por finca, camión e ingenio.
- Peso bruto, tara, tarifa.
- Neto y flete en vivo.
- Al guardar, volver a “Mis viajes” y mostrar toast de éxito.

**Editar viaje (`/mis-viajes/:id`)**
- Cargar el viaje con `GET /viajes/{id}`.
- Si no es propio, el backend devuelve 404; mostrar “Viaje no encontrado”.
- El chofer no puede cambiar el chofer.
- No mostrar eliminar.

**Mi perfil (`/perfil`)**
- Usar `GET /auth/me`.
- Mostrar usuario, rol, nombre del chofer, DNI y estado.
- No permitir editar datos desde acá (el backend no lo expone para choferes).
- Botón de logout.

---

## 12. Validaciones de formularios

Reflejá estas reglas en el cliente para dar feedback temprano, pero **siempre manejá también el error del backend**.

| Campo | Regla |
|---|---|
| `localidad_nombre` | 1–100 caracteres |
| `departamento` | 1–100 caracteres |
| `finca_nombre` | 1–100 caracteres |
| `id_localidad` | entero > 0, existente |
| `producto_cuit` | 1–20 caracteres, editable solo en alta |
| `producto_nombre` | 1–100 caracteres |
| `camion_patente` | 6–10 caracteres, mayúsculas |
| `chofer_dni` | solo dígitos, 6–20, editable solo en alta |
| `chofer_nombre` | 1–100 caracteres |
| `telefonos[]` | 6–20, solo `0-9 + -` y espacios, sin duplicados |
| `ingenio_nombre` | 1–100 caracteres |
| `id_viaje` | 1–20 caracteres, único |
| `num_vale` | 1–20 caracteres, único |
| `id_finca` | entero > 0, existente |
| `producto_cuit` (viaje) | existente y asociado a la finca |
| `camion_patente` (viaje) | 6–10, existente |
| `chofer_dni` (viaje) | solo dígitos, 6–20, existente |
| `id_ingenio` | entero > 0, existente |
| `peso_bruto_kg` | número >= 0, hasta 2 decimales |
| `tara_kg` | número >= 0, hasta 2 decimales |
| `tarifa_ton` | número >= 0, hasta 2 decimales |
| `peso_bruto_kg >= tara_kg` | validación cruzada |
| `usuario_nombre` | 3–50, único |
| `password` | 8–128 |
| `rol` | `ADMIN` o `CHOFER` |
| `chofer_dni` (usuario) | obligatorio si `rol = CHOFER`; prohibido si `ADMIN` |

Recomendaciones:
- Convertir strings de inputs numéricos a `number` antes de enviar.
- No enviar `""` en campos numéricos; validar vacío.
- Para precios y pesos, aceptar coma o punto decimal y normalizar a punto.
- Mostrar los importes con separador de miles y 2 decimales.
- Deshabilitar el botón de guardar mientras se envía para evitar dobles altas.
- Al cambiar de finca, limpiar el productor seleccionado si no está asociado.

---

## 13. UX, formato y accesibilidad

- **Mobile-first**, especialmente para el chofer. La app debe funcionar bien desde 360 px.
- Tablas con scroll horizontal en mobile o transformadas en tarjetas.
- Botones táctiles de al menos 44 px.
- Etiquetas visibles en todos los campos; no usar solo placeholders.
- Mensajes de confirmación después de crear/editar/eliminar.
- Estados de carga: skeletons o spinners.
- Estados vacíos: texto claro y acción sugerida.
- Confirmación obligatoria antes de eliminar.
- No borrar filas de la UI hasta que el backend confirme.
- Colores consistentes para estados: éxito, error, advertencia, información.
- Contraste suficiente y foco visible para accesibilidad.
- Formato de números con `Intl.NumberFormat("es-AR")`.
- Formato de moneda:
  ```ts
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(valor)
  ```
- Formato de kg:
  ```ts
  new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(valor) + " kg"
  ```
- Toneladas: `neto / 1000`, con hasta 3 decimales.
- No muestres `null` ni `undefined`; usá `—`.
- Las fechas no existen: no inventes columnas de fecha.
- El nombre del sistema en el header: “Gestión Logística y Control de Fletes” o “Logística Agro”.

---

## 14. Configuración del frontend

Creá `frontend/.env.example`:

```
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

El cliente HTTP debe leer `import.meta.env.VITE_API_URL`.

Alternativa con proxy de Vite:

```ts
// vite.config.ts
server: {
  proxy: {
    "/api": {
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
    },
  },
}
```

En ese caso, `VITE_API_URL=/api/v1`.

El cliente Axios debe:
- Agregar `Authorization: Bearer <token>` si hay token.
- Interceptar `401` para cerrar sesión.
- Convertir errores a un formato uniforme.
- No agregar `Content-Type: application/json` en el login; usar `URLSearchParams`.

Ejemplo del login:

```ts
const body = new URLSearchParams();
body.append("username", usuario);
body.append("password", password);

await api.post("/auth/login", body, {
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});
```

---

## 15. Entregables

1. Código fuente completo en `frontend/`.
2. `frontend/README.md` con:
   - Requisitos.
   - Instalación (`npm install`).
   - Configuración de `.env`.
   - Cómo levantar el backend.
   - Cómo ejecutar el frontend (`npm run dev`).
   - Cómo compilar (`npm run build`).
   - Decisiones de diseño y supuestos.
   - Limitaciones conocidas.
3. `frontend/.env.example`.
4. Tipos TypeScript para todas las entidades y respuestas.
5. Manejo centralizado de errores y de sesión.
6. Diseño responsive.
7. Como mínimo, un test unitario de formateo y uno de protección de rutas (si el stack lo permite).

---

## 16. Criterios de aceptación

La entrega se considera correcta si:

- [ ] `npm install` y `npm run build` terminan sin errores.
- [ ] `npm run dev` levanta la app y consume el backend en `http://127.0.0.1:8000`.
- [ ] Se puede iniciar sesión con `admin / admin123`.
- [ ] Se puede iniciar sesión con `30111222 / chofer123`.
- [ ] El token persiste al recargar la página y se restaura con `/auth/me`.
- [ ] Un `401` cierra sesión y redirige al login.
- [ ] El ADMIN ve el menú completo y el CHOFER solo ve sus opciones.
- [ ] El CHOFER no puede acceder por URL directa a `/admin/*`.
- [ ] El ADMIN puede listar, crear, editar y eliminar localidades, fincas, productores, choferes e ingenios.
- [ ] El ADMIN puede crear y eliminar camiones.
- [ ] El ADMIN puede asociar y desasociar productores de una finca.
- [ ] El ADMIN puede listar, crear, editar y eliminar viajes.
- [ ] El ADMIN puede crear usuarios ADMIN y CHOFER, cambiar contraseña y activar/desactivar.
- [ ] El ADMIN no puede desactivar su propia cuenta.
- [ ] El CHOFER solo ve sus propios viajes.
- [ ] El CHOFER puede registrar un viaje con su propio DNI.
- [ ] El CHOFER no puede eliminar viajes.
- [ ] El CHOFER no puede reasignar un viaje a otro chofer.
- [ ] El formulario de viaje filtra los productores según la finca seleccionada.
- [ ] El formulario de viaje calcula y muestra peso neto y flete en vivo.
- [ ] El backend rechaza `peso_bruto_kg < tara_kg` y la UI muestra el error.
- [ ] Los errores `409` de duplicados y de registros en uso se muestran con el mensaje del backend.
- [ ] Los filtros de viajes funcionan por finca, ingenio, chofer, camión y productor.
- [ ] La paginación funciona con `skip` y `limit`.
- [ ] Los importes se muestran en formato ARS y los pesos en kg.
- [ ] La app es usable a 360 px de ancho.
- [ ] No hay errores en consola en los flujos principales.
- [ ] No se inventaron fechas, estados ni endpoints.

---

## 17. Datos de prueba

La base seed trae:

**Localidades:**
- Concepción — Chicligasta
- Monteros — Monteros
- Simoca — Simoca

**Fincas:**
- La Esperanza (Concepción)
- El Porvenir (Monteros)
- San José (Simoca)

**Productores:**
- `20-12345678-3` — Pérez, Juan
- `23-23456789-4` — Gómez, María
- `27-34567890-5` — Rodríguez, Carlos

**Camiones:**
- `AB123CD`
- `AC456EF`
- `AD789GH`
- `AE012IJ`

**Choferes:**
- `30111222` — Gómez, Luis — teléfonos `3865400001`, `3865400002`
- `28444555` — Díaz, Ana — teléfono `3814555000`
- `35666777` — Sosa, Pedro — teléfono `3864700003`

**Ingenios:**
- Ingenio Concepción
- Ingenio Santa Bárbara
- Ingenio La Corona

**Viajes:** 8 viajes de ejemplo (`V001` a `V008`, vales `VAL-001` a `VAL-008`).

**Cuentas:**
- `admin / admin123` → ADMIN
- `30111222 / chofer123` → CHOFER (Gómez, Luis)
- `28444555 / chofer123` → CHOFER (Díaz, Ana)
- `35666777 / chofer123` → CHOFER (Sosa, Pedro)

El chofer `30111222` tiene los viajes `V001`, `V004` y `V007`. Usalo para probar que solo ve los propios.

---

## 18. Fuera de alcance y advertencias

- **No hay fechas.** No agregues fecha de viaje, filtros por fecha ni gráficos por mes.
- **No hay estado del viaje.** No inventes “pendiente/entregado/cancelado”.
- **No hay autogeneración de `id_viaje`.** Lo escribe el usuario.
- **No hay endpoint de reportes ni exportación.** Si agregás exportación CSV, hacelo en el cliente y aclaralo como extra.
- **No hay endpoint de tarifas.** La tarifa se carga manualmente por viaje.
- **No hay edición de camiones.** La patente es la PK y no se puede cambiar.
- **No hay borrado de usuarios.** Se desactivan.
- **No hay borrado de viajes por parte del chofer.**
- **No modifiques el backend** para “acomodar” el frontend.
- **No uses datos mock** cuando el backend está disponible; usá la API real. Los mocks, si los usás para tests, deben ser explícitos.
- **No muestres contraseñas ni tokens** en la consola.
- **No confíes en el rol guardado en localStorage** para decidir permisos críticos; el backend es la autoridad. La UI solo mejora la experiencia.

---

## 19. Orden de trabajo sugerido

1. Crear el proyecto Vite + TypeScript y la estructura base.
2. Configurar Tailwind/MUI, router y layout.
3. Implementar el cliente HTTP, el manejo de errores y el `AuthContext`.
4. Implementar login, logout, restauración de sesión y rutas protegidas.
5. Implementar el layout y la navegación por rol.
6. Implementar los tipos de la API.
7. Implementar los catálogos del ADMIN (localidades, fincas, productores, camiones, choferes, ingenios).
8. Implementar la gestión de usuarios.
9. Implementar viajes del ADMIN: listado, filtros, alta, edición y baja.
10. Implementar las pantallas del CHOFER.
11. Implementar el dashboard con estadísticas calculadas.
12. Pulir responsive, estados de carga, vacíos y errores.
13. Escribir el README y los tests básicos.
14. Verificar el checklist de aceptación.

---

## 20. Resultado esperado

Una SPA en español, clara y funcional, que permita:

- Al ADMIN, administrar catálogos, usuarios y todos los viajes, y ver un tablero general.
- Al CHOFER, registrar y editar sus propios viajes de forma simple desde el celular, viendo el peso neto y el flete calculados automáticamente.

La aplicación debe sentirse como un sistema real de gestión logística, no como una demo estática: datos reales del backend, sesión persistente, permisos respetados, errores comprensibles y formularios que no permitan enviar datos inválidos.
