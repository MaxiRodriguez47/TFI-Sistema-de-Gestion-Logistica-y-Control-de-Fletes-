"""Endpoints de autenticación."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import UsuarioActual, crear_token_acceso, verificar_password
from ..database import get_db
from ..models import Usuario
from ..schemas import Token, UsuarioRead

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token, summary="Iniciar sesión")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.scalar(select(Usuario).where(Usuario.usuario_nombre == form.username))
    if usuario is None or not verificar_password(form.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not usuario.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="El usuario está desactivado")

    return Token(
        access_token=crear_token_acceso(usuario),
        rol=usuario.rol,
        chofer_dni=usuario.chofer_dni,
        nombre=usuario.chofer.chofer_nombre if usuario.chofer else usuario.usuario_nombre,
    )


@router.get("/me", response_model=UsuarioRead, summary="Datos del usuario autenticado")
def me(usuario: UsuarioActual):
    return usuario
