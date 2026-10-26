"""Endpoints de productores."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import AdminActual, UsuarioActual
from ..database import get_db
from ..models import Producto
from ..schemas import ProductoCreate, ProductoRead, ProductoUpdate
from ..utils import guardar, obtener_o_404

router = APIRouter(prefix="/productos", tags=["Productores"])


@router.get("", response_model=list[ProductoRead], summary="Listar productores")
def listar_productos(
    _usuario: UsuarioActual,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return db.scalars(select(Producto).order_by(Producto.producto_nombre).offset(skip).limit(limit)).all()


@router.get("/{producto_cuit}", response_model=ProductoRead, summary="Obtener un productor")
def obtener_producto(producto_cuit: str, _usuario: UsuarioActual, db: Session = Depends(get_db)):
    return obtener_o_404(db, Producto, producto_cuit, "Productor")


@router.post("", response_model=ProductoRead, status_code=status.HTTP_201_CREATED, summary="Crear productor")
def crear_producto(payload: ProductoCreate, _admin: AdminActual, db: Session = Depends(get_db)):
    producto = Producto(**payload.model_dump())
    db.add(producto)
    guardar(db)
    db.refresh(producto)
    return producto


@router.put("/{producto_cuit}", response_model=ProductoRead, summary="Actualizar productor")
def actualizar_producto(
    producto_cuit: str, payload: ProductoUpdate, _admin: AdminActual, db: Session = Depends(get_db)
):
    producto = obtener_o_404(db, Producto, producto_cuit, "Productor")
    if payload.producto_cuit != producto_cuit:
        raise HTTPException(status_code=400, detail="No se puede modificar el CUIT del productor")
    producto.producto_nombre = payload.producto_nombre
    guardar(db)
    db.refresh(producto)
    return producto


@router.delete("/{producto_cuit}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar productor")
def eliminar_producto(producto_cuit: str, _admin: AdminActual, db: Session = Depends(get_db)):
    producto = obtener_o_404(db, Producto, producto_cuit, "Productor")
    if producto.viajes:
        raise HTTPException(status_code=409, detail="No se puede eliminar el productor porque tiene viajes asociados")
    db.delete(producto)
    guardar(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
