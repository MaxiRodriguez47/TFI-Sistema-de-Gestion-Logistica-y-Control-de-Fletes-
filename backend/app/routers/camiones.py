"""Endpoints de camiones."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import AdminActual, UsuarioActual
from ..database import get_db
from ..models import Camion
from ..schemas import CamionCreate, CamionRead, CamionUpdate
from ..utils import guardar, obtener_o_404

router = APIRouter(prefix="/camiones", tags=["Camiones"])


@router.get("", response_model=list[CamionRead], summary="Listar camiones")
def listar_camiones(
    _usuario: UsuarioActual,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return db.scalars(select(Camion).order_by(Camion.camion_patente).offset(skip).limit(limit)).all()


@router.get("/{camion_patente}", response_model=CamionRead, summary="Obtener un camión")
def obtener_camion(camion_patente: str, _usuario: UsuarioActual, db: Session = Depends(get_db)):
    return obtener_o_404(db, Camion, camion_patente.upper(), "Camión")


@router.post("", response_model=CamionRead, status_code=status.HTTP_201_CREATED, summary="Crear camión")
def crear_camion(payload: CamionCreate, _admin: AdminActual, db: Session = Depends(get_db)):
    camion = Camion(**payload.model_dump())
    db.add(camion)
    guardar(db)
    db.refresh(camion)
    return camion


@router.put("/{camion_patente}", response_model=CamionRead, summary="Actualizar camión")
def actualizar_camion(camion_patente: str, payload: CamionUpdate, _admin: AdminActual, db: Session = Depends(get_db)):
    camion = obtener_o_404(db, Camion, camion_patente.upper(), "Camión")
    if payload.camion_patente != camion.camion_patente:
        raise HTTPException(status_code=400, detail="No se puede modificar la patente del camión")
    return camion


@router.delete("/{camion_patente}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar camión")
def eliminar_camion(camion_patente: str, _admin: AdminActual, db: Session = Depends(get_db)):
    camion = obtener_o_404(db, Camion, camion_patente.upper(), "Camión")
    if camion.viajes:
        raise HTTPException(status_code=409, detail="No se puede eliminar el camión porque tiene viajes asociados")
    db.delete(camion)
    guardar(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
