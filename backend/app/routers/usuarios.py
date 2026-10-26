"""Gestión de cuentas de usuario (solo administradores)."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import AdminActual, hashear_password
from ..database import get_db
from ..models import Chofer, Usuario
from ..schemas import UsuarioCreate, UsuarioRead, UsuarioUpdate
from ..utils import guardar, obtener_o_404

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("", response_model=list[UsuarioRead], summary="Listar usuarios")
def listar_usuarios(
    _admin: AdminActual,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return db.scalars(select(Usuario).order_by(Usuario.usuario_nombre).offset(skip).limit(limit)).all()


@router.post(
    "",
    response_model=UsuarioRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear usuario (administrador o chofer)",
)
def crear_usuario(payload: UsuarioCreate, _admin: AdminActual, db: Session = Depends(get_db)):
    existe = db.scalar(select(Usuario).where(Usuario.usuario_nombre == payload.usuario_nombre))
    if existe is not None:
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese nombre")

    if payload.rol == "CHOFER":
        obtener_o_404(db, Chofer, payload.chofer_dni, "Chofer")
        ya_tiene_usuario = db.scalar(select(Usuario).where(Usuario.chofer_dni == payload.chofer_dni))
        if ya_tiene_usuario is not None:
            raise HTTPException(status_code=409, detail="Ese chofer ya tiene un usuario asignado")

    usuario = Usuario(
        usuario_nombre=payload.usuario_nombre,
        password_hash=hashear_password(payload.password),
        rol=payload.rol,
        chofer_dni=payload.chofer_dni,
    )
    db.add(usuario)
    guardar(db)
    db.refresh(usuario)
    return usuario


@router.put("/{id_usuario}", response_model=UsuarioRead, summary="Actualizar contraseña o estado")
def actualizar_usuario(id_usuario: int, payload: UsuarioUpdate, admin: AdminActual, db: Session = Depends(get_db)):
    usuario = obtener_o_404(db, Usuario, id_usuario, "Usuario")

    if payload.activo is not None:
        if usuario.id_usuario == admin.id_usuario and not payload.activo:
            raise HTTPException(status_code=400, detail="No puede desactivar su propio usuario")
        usuario.activo = payload.activo

    if payload.password:
        usuario.password_hash = hashear_password(payload.password)

    guardar(db)
    db.refresh(usuario)
    return usuario
