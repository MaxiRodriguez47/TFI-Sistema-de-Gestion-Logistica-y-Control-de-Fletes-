"""Endpoints de choferes y sus teléfonos."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import AdminActual, UsuarioActual
from ..database import get_db
from ..models import Chofer, TelefonoChofer
from ..schemas import ChoferCreate, ChoferRead, ChoferUpdate
from ..utils import guardar, obtener_o_404

router = APIRouter(prefix="/choferes", tags=["Choferes"])


@router.get("", response_model=list[ChoferRead], summary="Listar choferes")
def listar_choferes(
    _usuario: UsuarioActual,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return db.scalars(select(Chofer).order_by(Chofer.chofer_nombre).offset(skip).limit(limit)).all()


@router.get("/{chofer_dni}", response_model=ChoferRead, summary="Obtener un chofer")
def obtener_chofer(chofer_dni: str, _usuario: UsuarioActual, db: Session = Depends(get_db)):
    return obtener_o_404(db, Chofer, chofer_dni, "Chofer")


@router.post("", response_model=ChoferRead, status_code=status.HTTP_201_CREATED, summary="Crear chofer")
def crear_chofer(payload: ChoferCreate, _admin: AdminActual, db: Session = Depends(get_db)):
    datos = payload.model_dump()
    telefonos = datos.pop("telefonos")
    chofer = Chofer(**datos, telefonos=[TelefonoChofer(telefono=t) for t in telefonos])
    db.add(chofer)
    guardar(db)
    db.refresh(chofer)
    return chofer


@router.put("/{chofer_dni}", response_model=ChoferRead, summary="Actualizar chofer y teléfonos")
def actualizar_chofer(chofer_dni: str, payload: ChoferUpdate, _admin: AdminActual, db: Session = Depends(get_db)):
    chofer = obtener_o_404(db, Chofer, chofer_dni, "Chofer")
    if payload.chofer_dni != chofer_dni:
        raise HTTPException(status_code=400, detail="No se puede modificar el DNI del chofer")

    chofer.chofer_nombre = payload.chofer_nombre

    actuales = {t.telefono for t in chofer.telefonos}
    nuevos = set(payload.telefonos)
    for telefono in list(chofer.telefonos):
        if telefono.telefono not in nuevos:
            chofer.telefonos.remove(telefono)
    for telefono in sorted(nuevos - actuales):
        chofer.telefonos.append(TelefonoChofer(telefono=telefono))

    guardar(db)
    db.refresh(chofer)
    return chofer


@router.delete("/{chofer_dni}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar chofer")
def eliminar_chofer(chofer_dni: str, _admin: AdminActual, db: Session = Depends(get_db)):
    chofer = obtener_o_404(db, Chofer, chofer_dni, "Chofer")
    if chofer.viajes:
        raise HTTPException(status_code=409, detail="No se puede eliminar el chofer porque tiene viajes asociados")
    db.delete(chofer)
    guardar(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
