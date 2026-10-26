-- ============================================================
-- Datos de prueba (seed) para logistica_agro (SQLite 3)
-- Ejecutar después de logistica_agro.sql:
--   py seed_db.py   (o el comando del README)
-- Es idempotente: usa INSERT OR IGNORE con IDs fijos.
-- ============================================================

PRAGMA foreign_keys = ON;

-- Localidades y departamentos
INSERT OR IGNORE INTO LOCALIDADES (ID_Localidad, Localidad_Nombre, Departamento) VALUES
    (1, 'Concepción', 'Chicligasta'),
    (2, 'Monteros',    'Monteros'),
    (3, 'Simoca',      'Simoca');

-- Fincas
INSERT OR IGNORE INTO FINCAS (ID_Finca, Finca_Nombre, ID_Localidad) VALUES
    (1, 'La Esperanza', 1),
    (2, 'El Porvenir',  2),
    (3, 'San José',     3);

-- Productores
INSERT OR IGNORE INTO PRODUCTOS (Producto_CUIT, Producto_Nombre) VALUES
    ('20-12345678-3', 'Pérez, Juan'),
    ('23-23456789-4', 'Gómez, María'),
    ('27-34567890-5', 'Rodríguez, Carlos');

-- Asociación finca - productor
INSERT OR IGNORE INTO FINCA_PRODUCTO (ID_Finca, Producto_CUIT) VALUES
    (1, '20-12345678-3'),
    (1, '23-23456789-4'),
    (2, '23-23456789-4'),
    (2, '20-12345678-3'),
    (3, '27-34567890-5');

-- Camiones
INSERT OR IGNORE INTO CAMIONES (Camion_Patente) VALUES
    ('AB123CD'),
    ('AC456EF'),
    ('AD789GH'),
    ('AE012IJ');

-- Choferes y sus teléfonos
INSERT OR IGNORE INTO CHOFERES (Chofer_DNI, Chofer_Nombre) VALUES
    ('30111222', 'Gómez, Luis'),
    ('28444555', 'Díaz, Ana'),
    ('35666777', 'Sosa, Pedro');

INSERT OR IGNORE INTO TELEFONOS_CHOFER (Chofer_DNI, Telefono) VALUES
    ('30111222', '3865400001'),
    ('30111222', '3865400002'),
    ('28444555', '3814555000'),
    ('35666777', '3864700003');

-- Ingenios
INSERT OR IGNORE INTO INGENIOS (ID_Ingenio, Ingenio_Nombre) VALUES
    (1, 'Ingenio Concepción'),
    (2, 'Ingenio Santa Bárbara'),
    (3, 'Ingenio La Corona');

-- Viajes (peso bruto y tara en kg, tarifa por tonelada)
INSERT OR IGNORE INTO VIAJES
    (ID_Viaje, ID_Finca, Producto_CUIT, Camion_Patente, Chofer_DNI, ID_Ingenio,
     Num_Vale, Peso_Bruto_Kg, Tara_Kg, Tarifa_Ton) VALUES
    ('V001', 1, '20-12345678-3', 'AB123CD', '30111222', 1, 'VAL-001', 32500, 12000, 8500),
    ('V002', 1, '23-23456789-4', 'AC456EF', '28444555', 2, 'VAL-002', 28000, 11500, 9000),
    ('V003', 2, '23-23456789-4', 'AD789GH', '35666777', 1, 'VAL-003', 35000, 13000, 8500),
    ('V004', 2, '20-12345678-3', 'AE012IJ', '30111222', 3, 'VAL-004', 31000, 12200, 9500),
    ('V005', 3, '27-34567890-5', 'AB123CD', '28444555', 2, 'VAL-005', 29500, 11800, 9000),
    ('V006', 3, '27-34567890-5', 'AC456EF', '35666777', 3, 'VAL-006', 33000, 12500, 8750),
    ('V007', 1, '20-12345678-3', 'AD789GH', '30111222', 2, 'VAL-007', 30500, 12000, 9250),
    ('V008', 2, '23-23456789-4', 'AE012IJ', '28444555', 1, 'VAL-008', 27500, 11000, 9000);
