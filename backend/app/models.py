"""Modelos ORM que reflejan el esquema de logistica_agro.sql."""

from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    Numeric,
    String,
    Table,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# Tabla asociativa N:M entre fincas y productores
finca_producto = Table(
    "FINCA_PRODUCTO",
    Base.metadata,
    Column("ID_Finca", Integer, ForeignKey("FINCAS.ID_Finca", ondelete="CASCADE"), primary_key=True),
    Column(
        "Producto_CUIT",
        String(20),
        ForeignKey("PRODUCTOS.Producto_CUIT", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Finca(Base):
    __tablename__ = "FINCAS"

    id_finca: Mapped[int] = mapped_column("ID_Finca", Integer, primary_key=True, autoincrement=True)
    finca_nombre: Mapped[str] = mapped_column("Finca_Nombre", String(100))
    localidad: Mapped[str] = mapped_column("Localidad", String(100))
    departamento: Mapped[str] = mapped_column("Departamento", String(100))

    productores: Mapped[list["Producto"]] = relationship(
        secondary=finca_producto,
        back_populates="fincas",
        lazy="selectin",
    )
    viajes: Mapped[list["Viaje"]] = relationship(
        back_populates="finca",
        foreign_keys="Viaje.id_finca",
    )


class Producto(Base):
    __tablename__ = "PRODUCTOS"

    producto_cuit: Mapped[str] = mapped_column("Producto_CUIT", String(20), primary_key=True)
    producto_nombre: Mapped[str] = mapped_column("Producto_Nombre", String(100))

    fincas: Mapped[list["Finca"]] = relationship(
        secondary=finca_producto,
        back_populates="productores",
        lazy="selectin",
    )
    viajes: Mapped[list["Viaje"]] = relationship(
        back_populates="producto",
        foreign_keys="Viaje.producto_cuit",
    )


class Camion(Base):
    __tablename__ = "CAMIONES"

    camion_patente: Mapped[str] = mapped_column("Camion_Patente", String(10), primary_key=True)

    viajes: Mapped[list["Viaje"]] = relationship(back_populates="camion")


class Chofer(Base):
    __tablename__ = "CHOFERES"

    chofer_dni: Mapped[str] = mapped_column("Chofer_DNI", String(20), primary_key=True)
    chofer_nombre: Mapped[str] = mapped_column("Chofer_Nombre", String(100))

    telefonos: Mapped[list["TelefonoChofer"]] = relationship(
        back_populates="chofer",
        cascade="all, delete-orphan",
        order_by="TelefonoChofer.telefono",
        lazy="selectin",
    )
    viajes: Mapped[list["Viaje"]] = relationship(back_populates="chofer")


class TelefonoChofer(Base):
    __tablename__ = "TELEFONOS_CHOFER"

    chofer_dni: Mapped[str] = mapped_column(
        "Chofer_DNI", String(20), ForeignKey("CHOFERES.Chofer_DNI", ondelete="CASCADE"), primary_key=True
    )
    telefono: Mapped[str] = mapped_column("Telefono", String(20), primary_key=True)

    chofer: Mapped["Chofer"] = relationship(back_populates="telefonos")


class Ingenio(Base):
    __tablename__ = "INGENIOS"

    id_ingenio: Mapped[int] = mapped_column("ID_Ingenio", Integer, primary_key=True, autoincrement=True)
    ingenio_nombre: Mapped[str] = mapped_column("Ingenio_Nombre", String(100), unique=True)

    viajes: Mapped[list["Viaje"]] = relationship(back_populates="ingenio")


class Viaje(Base):
    __tablename__ = "VIAJES"
    __table_args__ = (
        CheckConstraint("Peso_Bruto_Kg >= Tara_Kg", name="ck_viajes_bruto_tara"),
        CheckConstraint("Tara_Kg >= 0", name="ck_viajes_tara"),
        CheckConstraint("Tarifa_Ton >= 0", name="ck_viajes_tarifa"),
        ForeignKeyConstraint(
            ["ID_Finca", "Producto_CUIT"],
            ["FINCA_PRODUCTO.ID_Finca", "FINCA_PRODUCTO.Producto_CUIT"],
            name="fk_viajes_finca_producto",
        ),
    )

    id_viaje: Mapped[str] = mapped_column("ID_Viaje", String(20), primary_key=True)
    id_finca: Mapped[int] = mapped_column("ID_Finca", Integer, ForeignKey("FINCAS.ID_Finca"))
    producto_cuit: Mapped[str] = mapped_column("Producto_CUIT", String(20), ForeignKey("PRODUCTOS.Producto_CUIT"))
    camion_patente: Mapped[str] = mapped_column("Camion_Patente", String(10), ForeignKey("CAMIONES.Camion_Patente"))
    chofer_dni: Mapped[str] = mapped_column("Chofer_DNI", String(20), ForeignKey("CHOFERES.Chofer_DNI"))
    id_ingenio: Mapped[int] = mapped_column("ID_Ingenio", Integer, ForeignKey("INGENIOS.ID_Ingenio"))
    num_vale: Mapped[str] = mapped_column("Num_Vale", String(20), unique=True)
    peso_bruto_kg: Mapped[Decimal] = mapped_column("Peso_Bruto_Kg", Numeric(10, 2))
    tara_kg: Mapped[Decimal] = mapped_column("Tara_Kg", Numeric(10, 2))
    tarifa_ton: Mapped[Decimal] = mapped_column("Tarifa_Ton", Numeric(10, 2))

    finca: Mapped["Finca"] = relationship(back_populates="viajes", foreign_keys=[id_finca], lazy="selectin")
    producto: Mapped["Producto"] = relationship(back_populates="viajes", foreign_keys=[producto_cuit], lazy="selectin")
    camion: Mapped["Camion"] = relationship(back_populates="viajes", lazy="selectin")
    chofer: Mapped["Chofer"] = relationship(back_populates="viajes", lazy="selectin")
    ingenio: Mapped["Ingenio"] = relationship(back_populates="viajes", lazy="selectin")

    @property
    def peso_neto_kg(self) -> Decimal:
        """Carga útil real: peso bruto menos tara."""
        return self.peso_bruto_kg - self.tara_kg

    @property
    def flete(self) -> Decimal:
        """Importe del flete: toneladas netas por la tarifa pactada."""
        toneladas = self.peso_neto_kg / Decimal("1000")
        return (toneladas * self.tarifa_ton).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class Usuario(Base):
    """Cuenta de acceso. Rol ADMIN (jefe) o CHOFER (vinculado a un chofer por DNI)."""

    __tablename__ = "USUARIOS"
    __table_args__ = (
        CheckConstraint("Rol IN ('ADMIN', 'CHOFER')", name="ck_usuarios_rol"),
        CheckConstraint(
            "(Rol = 'ADMIN' AND Chofer_DNI IS NULL) OR (Rol = 'CHOFER' AND Chofer_DNI IS NOT NULL)",
            name="ck_usuarios_chofer",
        ),
    )

    id_usuario: Mapped[int] = mapped_column("ID_Usuario", Integer, primary_key=True, autoincrement=True)
    usuario_nombre: Mapped[str] = mapped_column("Usuario_Nombre", String(50), unique=True)
    password_hash: Mapped[str] = mapped_column("Password_Hash", String(255))
    rol: Mapped[str] = mapped_column("Rol", String(10))
    chofer_dni: Mapped[str | None] = mapped_column(
        "Chofer_DNI",
        String(20),
        ForeignKey("CHOFERES.Chofer_DNI", ondelete="CASCADE"),
        unique=True,
        nullable=True,
    )
    activo: Mapped[bool] = mapped_column("Activo", Boolean, default=True, server_default=text("1"), nullable=False)

    chofer: Mapped["Chofer | None"] = relationship(lazy="joined")

    @property
    def chofer_nombre(self) -> str | None:
        return self.chofer.chofer_nombre if self.chofer else None
