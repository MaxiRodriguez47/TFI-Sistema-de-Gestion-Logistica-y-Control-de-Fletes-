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
- **Base de Datos:** MySQL (Modelo Relacional rigurosamente diseñado en Tercera Forma Normal - 3FN).
- **ORM:** SQLAlchemy 2.0 (Para la interacción segura con la base de datos).
- **Validación de Datos:** Pydantic v2 (Para la limpieza de datos de entrada y el cálculo de propiedades dinámicas como el monto del flete).
- **Documentación:** Swagger UI / ReDoc (Autogenerada por FastAPI).

---

## 👨‍💻 Acerca del Proyecto

Este sistema está siendo desarrollado como proyecto integrador para la asignatura **Programación IV** correspondiente a la **Tecnicatura Universitaria en Programación** dictada en la **Universidad Tecnológica Nacional (UTN)**.

- **Comisión:** C11
- **Equipo de Desarrollo:**
  - Rodríguez, Maximiliano
  - Ibarra, Santiago Luciano