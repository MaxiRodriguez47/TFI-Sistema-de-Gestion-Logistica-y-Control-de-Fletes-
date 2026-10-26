"""Endpoints de localidades y sus departamentos."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import AdminActual, UsuarioActual
from ..database import get_db
from ..models import Localidad
from ..schemas import LocalidadCreate, LocalidadRead, LocalidadUpdate
from ..utils import guardar, obtener_o_404

router = APIRouter(prefix="/localidades", tags=["Localidades"])


@router.get("", response_model=list[LocalidadRead], summary="Listar localidades")
def listar_localidades(
    _usuario: UsuarioActual,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Localidad).order_by(Localidad.departamento, Localidad.localidad_nombre).offset(skip).limit(limit)
    ).all()


@router.get("/{id_localidad}", response_model=LocalidadRead, summary="Obtener una localidad")
def obtener_localidad(id_localidad: int, _usuario: UsuarioActual, db: Session = Depends(get_db)):
    return obtener_o_404(db, Localidad, id_localidad, "Localidad")


@router.post("", response_model=LocalidadRead, status_code=status.HTTP_201_CREATED, summary="Crear localidad")
def crear_localidad(payload: LocalidadCreate, _admin: AdminActual, db: Session = Depends(get_db)):
    localidad = Localidad(**payload.model_dump())
    db.add(localidad)
    guardar(db, mensaje_conflicto="Ya existe esa localidad en el departamento indicado")
    db.refresh(localidad)
    return localidad


@router.put("/{id_localidad}", response_model=LocalidadRead, summary="Actualizar localidad")
def actualizar_localidad(
    id_localidad: int,
    payload: LocalidadUpdate,
    _admin: AdminActual,
    db: Session = Depends(get_db),
):
    localidad = obtener_o_404(db, Localidad, id_localidad, "Localidad")
    for campo, valor in payload.model_dump().items():
        setattr(localidad, campo, valor)
    guardar(db, mensaje_conflicto="Ya existe esa localidad en el departamento indicado")
    db.refresh(localidad)
    return localidad


@router.delete("/{id_localidad}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar localidad")
def eliminar_localidad(id_localidad: int, _admin: AdminActual, db: Session = Depends(get_db)):
    localidad = obtener_o_404(db, Localidad, id_localidad, "Localidad")
    if localidad.fincas:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar la localidad porque tiene fincas asociadas",
        )
    db.delete(localidad)
    guardar(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
