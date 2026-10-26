"""Esquemas de entrada/salida (Pydantic v2) de la API."""

from decimal import Decimal
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    PlainSerializer,
    field_validator,
    model_validator,
)

# Decimal con 2 posiciones y salida numérica en JSON (no string)
Decimal2 = Annotated[
    Decimal,
    Field(ge=0, max_digits=10, decimal_places=2),
    PlainSerializer(float, return_type=float),
]

TelefonoStr = Annotated[str, Field(min_length=6, max_length=20, pattern=r"^[0-9+\-\s]+$")]


class LocalidadBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    localidad_nombre: str = Field(min_length=1, max_length=100)
    departamento: str = Field(min_length=1, max_length=100)


class LocalidadCreate(LocalidadBase):
    pass


class LocalidadUpdate(LocalidadBase):
    pass


class LocalidadResumen(LocalidadBase):
    id_localidad: int


class FincaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    finca_nombre: str = Field(min_length=1, max_length=100)
    id_localidad: int = Field(gt=0)


class FincaCreate(FincaBase):
    pass


class FincaUpdate(FincaBase):
    pass


class FincaResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_finca: int
    finca_nombre: str


class FincaRead(FincaBase):
    id_finca: int
    localidad: LocalidadResumen
    productores: list["ProductoResumen"] = Field(default_factory=list)


class LocalidadRead(LocalidadBase):
    id_localidad: int
    fincas: list[FincaResumen] = Field(default_factory=list)


class ProductoBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    producto_cuit: str = Field(min_length=1, max_length=20)
    producto_nombre: str = Field(min_length=1, max_length=100)


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(ProductoBase):
    pass


class ProductoResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    producto_cuit: str
    producto_nombre: str


class ProductoRead(ProductoBase):
    fincas: list[FincaResumen] = Field(default_factory=list)


class CamionBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    camion_patente: str = Field(min_length=6, max_length=10)

    @field_validator("camion_patente")
    @classmethod
    def normalizar_patente(cls, valor: str) -> str:
        return valor.strip().upper()


class CamionCreate(CamionBase):
    pass


class CamionUpdate(CamionBase):
    pass


class CamionResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    camion_patente: str


class CamionRead(CamionBase):
    pass


class ChoferBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chofer_dni: str = Field(min_length=6, max_length=20, pattern=r"^\d+$")
    chofer_nombre: str = Field(min_length=1, max_length=100)


class ChoferCreate(ChoferBase):
    telefonos: list[TelefonoStr] = Field(default_factory=list)

    @field_validator("telefonos")
    @classmethod
    def telefonos_sin_duplicados(cls, valor: list[str]) -> list[str]:
        if len(valor) != len(set(valor)):
            raise ValueError("No se pueden repetir teléfonos para un mismo chofer")
        return valor


class ChoferUpdate(ChoferCreate):
    pass


class ChoferResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chofer_dni: str
    chofer_nombre: str


class ChoferRead(ChoferBase):
    telefonos: list[TelefonoStr] = Field(default_factory=list)

    @field_validator("telefonos", mode="before")
    @classmethod
    def extraer_telefonos(cls, valor: object) -> list[str]:
        if valor is None:
            return []
        return [getattr(t, "telefono", t) for t in valor]  # type: ignore[union-attr]


class IngenioBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ingenio_nombre: str = Field(min_length=1, max_length=100)


class IngenioCreate(IngenioBase):
    pass


class IngenioUpdate(IngenioBase):
    pass


class IngenioResumen(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_ingenio: int
    ingenio_nombre: str


class IngenioRead(IngenioBase):
    id_ingenio: int


class ViajeBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_finca: int = Field(gt=0)
    producto_cuit: str = Field(min_length=1, max_length=20)
    camion_patente: str = Field(min_length=6, max_length=10)
    chofer_dni: str = Field(min_length=6, max_length=20, pattern=r"^\d+$")
    id_ingenio: int = Field(gt=0)
    num_vale: str = Field(min_length=1, max_length=20)
    peso_bruto_kg: Decimal2
    tara_kg: Decimal2
    tarifa_ton: Decimal2

    @field_validator("camion_patente")
    @classmethod
    def normalizar_patente(cls, valor: str) -> str:
        return valor.strip().upper()

    @model_validator(mode="after")
    def validar_pesos(self) -> "ViajeBase":
        if self.peso_bruto_kg < self.tara_kg:
            raise ValueError("El peso bruto debe ser mayor o igual a la tara")
        return self


class ViajeCreate(ViajeBase):
    id_viaje: str = Field(min_length=1, max_length=20)


class ViajeUpdate(ViajeBase):
    pass


class ViajeRead(ViajeBase):
    id_viaje: str
    peso_neto_kg: Decimal2
    flete: Decimal2
    finca: FincaResumen
    producto: ProductoResumen
    camion: CamionResumen
    chofer: ChoferResumen
    ingenio: IngenioResumen


# ---------------------------------------------------------------------------
# Usuarios y autenticación
# ---------------------------------------------------------------------------

RolUsuario = Literal["ADMIN", "CHOFER"]


class UsuarioCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    usuario_nombre: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    rol: RolUsuario
    chofer_dni: str | None = Field(default=None, min_length=6, max_length=20, pattern=r"^\d+$")

    @model_validator(mode="after")
    def validar_vinculo(self) -> "UsuarioCreate":
        if self.rol == "CHOFER" and not self.chofer_dni:
            raise ValueError("Un usuario con rol chofer debe estar vinculado a un DNI")
        if self.rol == "ADMIN" and self.chofer_dni:
            raise ValueError("Un usuario administrador no debe estar vinculado a un chofer")
        return self


class UsuarioUpdate(BaseModel):
    password: str | None = Field(default=None, min_length=8, max_length=128)
    activo: bool | None = None


class UsuarioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_usuario: int
    usuario_nombre: str
    rol: str
    chofer_dni: str | None = None
    activo: bool
    chofer_nombre: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str
    chofer_dni: str | None = None
    nombre: str
