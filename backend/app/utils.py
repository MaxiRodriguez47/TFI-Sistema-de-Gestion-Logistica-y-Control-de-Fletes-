"""Utilidades compartidas por los routers."""

from typing import TypeVar

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import Base

Modelo = TypeVar("Modelo", bound=Base)


def obtener_o_404(db: Session, modelo: type[Modelo], pk: object, nombre: str) -> Modelo:
    """Busca por clave primaria o lanza 404."""
    obj = db.get(modelo, pk)
    if obj is None:
        raise HTTPException(status_code=404, detail=f"{nombre} no encontrado/a")
    return obj


def guardar(db: Session, mensaje_conflicto: str = "Ya existe un registro con esos datos") -> None:
    """Confirma la transacción traduciendo errores de integridad a HTTP 409/422."""
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        detalle = str(exc.orig)
        if "FOREIGN KEY" in detalle:
            raise HTTPException(
                status_code=409,
                detail="La operación afecta registros relacionados (claves foráneas)",
            ) from exc
        if "CHECK" in detalle:
            raise HTTPException(
                status_code=422,
                detail="Los datos no cumplen una restricción de la base de datos",
            ) from exc
        if "NOT NULL" in detalle:
            raise HTTPException(status_code=422, detail="Faltan datos obligatorios") from exc
        raise HTTPException(status_code=409, detail=mensaje_conflicto) from exc
