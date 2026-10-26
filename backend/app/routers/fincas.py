"""Endpoints de fincas y su asociación con productores."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import AdminActual, UsuarioActual
from ..database import get_db
from ..models import Finca, Producto
from ..schemas import FincaCreate, FincaRead, FincaUpdate
from ..utils import guardar, obtener_o_404

router = APIRouter(prefix="/fincas", tags=["Fincas"])


@router.get("", response_model=list[FincaRead], summary="Listar fincas")
def listar_fincas(
    _usuario: UsuarioActual,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return db.scalars(select(Finca).order_by(Finca.id_finca).offset(skip).limit(limit)).all()


@router.get("/{id_finca}", response_model=FincaRead, summary="Obtener una finca")
def obtener_finca(id_finca: int, _usuario: UsuarioActual, db: Session = Depends(get_db)):
    return obtener_o_404(db, Finca, id_finca, "Finca")


@router.post("", response_model=FincaRead, status_code=status.HTTP_201_CREATED, summary="Crear finca")
def crear_finca(payload: FincaCreate, _admin: AdminActual, db: Session = Depends(get_db)):
    finca = Finca(**payload.model_dump())
    db.add(finca)
    guardar(db)
    db.refresh(finca)
    return finca


@router.put("/{id_finca}", response_model=FincaRead, summary="Actualizar finca")
def actualizar_finca(id_finca: int, payload: FincaUpdate, _admin: AdminActual, db: Session = Depends(get_db)):
    finca = obtener_o_404(db, Finca, id_finca, "Finca")
    for campo, valor in payload.model_dump().items():
        setattr(finca, campo, valor)
    guardar(db)
    db.refresh(finca)
    return finca


@router.delete("/{id_finca}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar finca")
def eliminar_finca(id_finca: int, _admin: AdminActual, db: Session = Depends(get_db)):
    finca = obtener_o_404(db, Finca, id_finca, "Finca")
    db.delete(finca)
    guardar(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{id_finca}/productores/{producto_cuit}",
    response_model=FincaRead,
    summary="Asociar un productor a la finca",
)
def asociar_productor(id_finca: int, producto_cuit: str, _admin: AdminActual, db: Session = Depends(get_db)):
    finca = obtener_o_404(db, Finca, id_finca, "Finca")
    producto = obtener_o_404(db, Producto, producto_cuit, "Productor")
    if producto not in finca.productores:
        finca.productores.append(producto)
        guardar(db)
        db.refresh(finca)
    return finca


@router.delete(
    "/{id_finca}/productores/{producto_cuit}",
    response_model=FincaRead,
    summary="Desasociar un productor de la finca",
)
def desasociar_productor(id_finca: int, producto_cuit: str, _admin: AdminActual, db: Session = Depends(get_db)):
    finca = obtener_o_404(db, Finca, id_finca, "Finca")
    producto = obtener_o_404(db, Producto, producto_cuit, "Productor")
    if producto not in finca.productores:
        raise HTTPException(status_code=404, detail="El productor no está asociado a la finca")
    finca.productores.remove(producto)
    guardar(db)
    db.refresh(finca)
    return finca
