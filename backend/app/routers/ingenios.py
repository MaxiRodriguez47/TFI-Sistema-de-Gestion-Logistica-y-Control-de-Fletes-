"""Endpoints de ingenios."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import AdminActual, UsuarioActual
from ..database import get_db
from ..models import Ingenio
from ..schemas import IngenioCreate, IngenioRead, IngenioUpdate
from ..utils import guardar, obtener_o_404

router = APIRouter(prefix="/ingenios", tags=["Ingenios"])


@router.get("", response_model=list[IngenioRead], summary="Listar ingenios")
def listar_ingenios(
    _usuario: UsuarioActual,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return db.scalars(select(Ingenio).order_by(Ingenio.ingenio_nombre).offset(skip).limit(limit)).all()


@router.get("/{id_ingenio}", response_model=IngenioRead, summary="Obtener un ingenio")
def obtener_ingenio(id_ingenio: int, _usuario: UsuarioActual, db: Session = Depends(get_db)):
    return obtener_o_404(db, Ingenio, id_ingenio, "Ingenio")


@router.post("", response_model=IngenioRead, status_code=status.HTTP_201_CREATED, summary="Crear ingenio")
def crear_ingenio(payload: IngenioCreate, _admin: AdminActual, db: Session = Depends(get_db)):
    ingenio = Ingenio(**payload.model_dump())
    db.add(ingenio)
    guardar(db, mensaje_conflicto="Ya existe un ingenio con ese nombre")
    db.refresh(ingenio)
    return ingenio


@router.put("/{id_ingenio}", response_model=IngenioRead, summary="Actualizar ingenio")
def actualizar_ingenio(id_ingenio: int, payload: IngenioUpdate, _admin: AdminActual, db: Session = Depends(get_db)):
    ingenio = obtener_o_404(db, Ingenio, id_ingenio, "Ingenio")
    ingenio.ingenio_nombre = payload.ingenio_nombre
    guardar(db, mensaje_conflicto="Ya existe un ingenio con ese nombre")
    db.refresh(ingenio)
    return ingenio


@router.delete("/{id_ingenio}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar ingenio")
def eliminar_ingenio(id_ingenio: int, _admin: AdminActual, db: Session = Depends(get_db)):
    ingenio = obtener_o_404(db, Ingenio, id_ingenio, "Ingenio")
    if ingenio.viajes:
        raise HTTPException(status_code=409, detail="No se puede eliminar el ingenio porque tiene viajes asociados")
    db.delete(ingenio)
    guardar(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
