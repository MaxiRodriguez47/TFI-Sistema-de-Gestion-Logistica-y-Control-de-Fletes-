-- ============================================================
-- Base de datos: logistica_agro (SQLite 3)
-- Sistema de Gestión Logística y Control de Fletes de Caña de Azúcar
--
-- Nota: SQLite no tiene CREATE DATABASE / USE. La base es el
-- archivo logistica_agro.db que se crea al ejecutar este script.
--
-- Las claves foráneas están desactivadas por defecto en SQLite:
-- hay que ejecutar PRAGMA foreign_keys = ON en cada conexión.
-- ============================================================

PRAGMA foreign_keys = ON;

-- 1. Tabla FINCAS
CREATE TABLE IF NOT EXISTS FINCAS (
    ID_Finca INTEGER PRIMARY KEY AUTOINCREMENT,
    Finca_Nombre VARCHAR(100) NOT NULL,
    Localidad VARCHAR(100) NOT NULL,
    Departamento VARCHAR(100) NOT NULL
);

-- 2. Tabla PRODUCTOS (productores)
CREATE TABLE IF NOT EXISTS PRODUCTOS (
    Producto_CUIT VARCHAR(20) PRIMARY KEY NOT NULL,
    Producto_Nombre VARCHAR(100) NOT NULL
);

-- 3. Tabla asociativa FINCA_PRODUCTO (N:M)
CREATE TABLE IF NOT EXISTS FINCA_PRODUCTO (
    ID_Finca INTEGER NOT NULL,
    Producto_CUIT VARCHAR(20) NOT NULL,
    PRIMARY KEY (ID_Finca, Producto_CUIT),
    FOREIGN KEY (ID_Finca) REFERENCES FINCAS(ID_Finca) ON DELETE CASCADE,
    FOREIGN KEY (Producto_CUIT) REFERENCES PRODUCTOS(Producto_CUIT) ON DELETE CASCADE
);

-- 4. Tabla CAMIONES
CREATE TABLE IF NOT EXISTS CAMIONES (
    Camion_Patente VARCHAR(10) PRIMARY KEY NOT NULL
);

-- 5. Tabla CHOFERES
CREATE TABLE IF NOT EXISTS CHOFERES (
    Chofer_DNI VARCHAR(20) PRIMARY KEY NOT NULL,
    Chofer_Nombre VARCHAR(100) NOT NULL
);

-- 6. Tabla TELEFONOS_CHOFER (atributo multivaluado)
CREATE TABLE IF NOT EXISTS TELEFONOS_CHOFER (
    Chofer_DNI VARCHAR(20) NOT NULL,
    Telefono VARCHAR(20) NOT NULL,
    PRIMARY KEY (Chofer_DNI, Telefono),
    FOREIGN KEY (Chofer_DNI) REFERENCES CHOFERES(Chofer_DNI) ON DELETE CASCADE
);

-- 7. Tabla INGENIOS
CREATE TABLE IF NOT EXISTS INGENIOS (
    ID_Ingenio INTEGER PRIMARY KEY AUTOINCREMENT,
    Ingenio_Nombre VARCHAR(100) NOT NULL UNIQUE
);

-- 8. Tabla VIAJES (transaccional principal)
CREATE TABLE IF NOT EXISTS VIAJES (
    ID_Viaje VARCHAR(20) PRIMARY KEY NOT NULL,
    ID_Finca INTEGER NOT NULL,
    Producto_CUIT VARCHAR(20) NOT NULL,
    Camion_Patente VARCHAR(10) NOT NULL,
    Chofer_DNI VARCHAR(20) NOT NULL,
    ID_Ingenio INTEGER NOT NULL,
    Num_Vale VARCHAR(20) NOT NULL UNIQUE,
    Peso_Bruto_Kg DECIMAL(10,2) NOT NULL,
    Tara_Kg DECIMAL(10,2) NOT NULL,
    Tarifa_Ton DECIMAL(10,2) NOT NULL,
    -- El bruto debe ser mayor o igual a la tara (el neto no puede ser negativo)
    CHECK (Peso_Bruto_Kg >= Tara_Kg),
    CHECK (Tara_Kg >= 0),
    CHECK (Tarifa_Ton >= 0),
    FOREIGN KEY (ID_Finca) REFERENCES FINCAS(ID_Finca),
    FOREIGN KEY (Producto_CUIT) REFERENCES PRODUCTOS(Producto_CUIT),
    FOREIGN KEY (Camion_Patente) REFERENCES CAMIONES(Camion_Patente),
    FOREIGN KEY (Chofer_DNI) REFERENCES CHOFERES(Chofer_DNI),
    FOREIGN KEY (ID_Ingenio) REFERENCES INGENIOS(ID_Ingenio),
    -- El productor del viaje debe estar asociado a la finca de origen
    FOREIGN KEY (ID_Finca, Producto_CUIT) REFERENCES FINCA_PRODUCTO(ID_Finca, Producto_CUIT)
);

-- Índices de apoyo para las claves foráneas más consultadas
CREATE INDEX IF NOT EXISTS idx_viajes_finca ON VIAJES(ID_Finca);
CREATE INDEX IF NOT EXISTS idx_viajes_ingenio ON VIAJES(ID_Ingenio);
CREATE INDEX IF NOT EXISTS idx_viajes_chofer ON VIAJES(Chofer_DNI);
CREATE INDEX IF NOT EXISTS idx_viajes_camion ON VIAJES(Camion_Patente);
CREATE INDEX IF NOT EXISTS idx_viajes_producto ON VIAJES(Producto_CUIT);
