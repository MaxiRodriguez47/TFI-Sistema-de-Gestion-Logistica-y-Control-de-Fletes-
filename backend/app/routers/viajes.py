"""Endpoints del circuito transaccional de viajes."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import AdminActual, ChoferActual, UsuarioActual
from ..database import get_db
from ..models import Camion, Chofer, Finca, Ingenio, Producto, Usuario, Viaje
from ..schemas import ViajeBase, ViajeCreate, ViajeRead, ViajeUpdate
from ..utils import guardar, obtener_o_404

router = APIRouter(prefix="/viajes", tags=["Viajes"])


def _validar_referencias(db: Session, datos: ViajeBase) -> Finca:
    """Valida que las entidades referenciadas existan y que el productor sea de la finca."""
    finca = obtener_o_404(db, Finca, datos.id_finca, "Finca")
    obtener_o_404(db, Producto, datos.producto_cuit, "Productor")
    obtener_o_404(db, Camion, datos.camion_patente, "Camión")
    obtener_o_404(db, Chofer, datos.chofer_dni, "Chofer")
    obtener_o_404(db, Ingenio, datos.id_ingenio, "Ingenio")

    if datos.producto_cuit not in {p.producto_cuit for p in finca.productores}:
        raise HTTPException(status_code=400, detail="El productor indicado no está asociado a la finca de origen")
    return finca


def _obtener_viaje_permitido(db: Session, id_viaje: str, usuario: Usuario) -> Viaje:
    """Devuelve el viaje si el usuario puede verlo; un chofer solo accede a los propios."""
    viaje = obtener_o_404(db, Viaje, id_viaje, "Viaje")
    if usuario.rol == "CHOFER" and viaje.chofer_dni != usuario.chofer_dni:
        raise HTTPException(status_code=404, detail="Viaje no encontrado")
    return viaje


@router.get("", response_model=list[ViajeRead], summary="Listar viajes")
def listar_viajes(
    usuario: UsuarioActual,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    id_finca: int | None = Query(None, description="Filtrar por finca de origen"),
    id_ingenio: int | None = Query(None, description="Filtrar por ingenio de destino"),
    chofer_dni: str | None = Query(None, description="Filtrar por chofer"),
    camion_patente: str | None = Query(None, description="Filtrar por camión"),
    producto_cuit: str | None = Query(None, description="Filtrar por productor"),
    db: Session = Depends(get_db),
):
    # Un chofer nunca puede ver viajes de otros: se fuerza su propio DNI.
    if usuario.rol == "CHOFER":
        chofer_dni = usuario.chofer_dni

    consulta = select(Viaje)
    if id_finca is not None:
        consulta = consulta.where(Viaje.id_finca == id_finca)
    if id_ingenio is not None:
        consulta = consulta.where(Viaje.id_ingenio == id_ingenio)
    if chofer_dni is not None:
        consulta = consulta.where(Viaje.chofer_dni == chofer_dni)
    if camion_patente is not None:
        consulta = consulta.where(Viaje.camion_patente == camion_patente.upper())
    if producto_cuit is not None:
        consulta = consulta.where(Viaje.producto_cuit == producto_cuit)
    return db.scalars(consulta.order_by(Viaje.id_viaje).offset(skip).limit(limit)).all()


@router.get("/mis-viajes", response_model=list[ViajeRead], summary="Viajes del chofer autenticado")
def mis_viajes(
    usuario: ChoferActual,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    consulta = (
        select(Viaje).where(Viaje.chofer_dni == usuario.chofer_dni).order_by(Viaje.id_viaje).offset(skip).limit(limit)
    )
    return db.scalars(consulta).all()


@router.get("/{id_viaje}", response_model=ViajeRead, summary="Obtener un viaje")
def obtener_viaje(id_viaje: str, usuario: UsuarioActual, db: Session = Depends(get_db)):
    return _obtener_viaje_permitido(db, id_viaje, usuario)


@router.post("", response_model=ViajeRead, status_code=status.HTTP_201_CREATED, summary="Registrar viaje")
def crear_viaje(payload: ViajeCreate, usuario: UsuarioActual, db: Session = Depends(get_db)):
    # El chofer solo puede informar viajes a su nombre.
    if usuario.rol == "CHOFER" and payload.chofer_dni != usuario.chofer_dni:
        raise HTTPException(status_code=403, detail="Solo puede registrar viajes con su propio DNI")

    _validar_referencias(db, payload)
    viaje = Viaje(**payload.model_dump())
    db.add(viaje)
    guardar(db, mensaje_conflicto="Ya existe un viaje con ese ID o ese número de vale")
    db.refresh(viaje)
    return viaje


@router.put("/{id_viaje}", response_model=ViajeRead, summary="Actualizar viaje")
def actualizar_viaje(id_viaje: str, payload: ViajeUpdate, usuario: UsuarioActual, db: Session = Depends(get_db)):
    viaje = _obtener_viaje_permitido(db, id_viaje, usuario)
    if usuario.rol == "CHOFER" and payload.chofer_dni != usuario.chofer_dni:
        raise HTTPException(status_code=403, detail="No puede reasignar el viaje a otro chofer")

    _validar_referencias(db, payload)
    for campo, valor in payload.model_dump().items():
        setattr(viaje, campo, valor)
    guardar(db, mensaje_conflicto="Ya existe otro viaje con ese número de vale")
    db.refresh(viaje)
    return viaje


@router.delete("/{id_viaje}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar viaje")
def eliminar_viaje(id_viaje: str, _admin: AdminActual, db: Session = Depends(get_db)):
    viaje = obtener_o_404(db, Viaje, id_viaje, "Viaje")
    db.delete(viaje)
    guardar(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
