"""Autenticación con JWT y control de acceso por roles."""

import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import Usuario

SECRET_KEY = os.getenv("SECRET_KEY", "logistica-agro-dev-secret-cambiar-en-produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

password_hasher = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hashear_password(password: str) -> str:
    return password_hasher.hash(password)


def verificar_password(password: str, password_hash: str) -> bool:
    return password_hasher.verify(password, password_hash)


def crear_token_acceso(usuario: Usuario) -> str:
    expira = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": usuario.usuario_nombre,
        "rol": usuario.rol,
        "dni": usuario.chofer_dni,
        "exp": expira,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    """Decodifica el token y devuelve el usuario activo de la base."""
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except InvalidTokenError as exc:
        raise credenciales_invalidas from exc

    usuario_nombre = payload.get("sub")
    if not usuario_nombre:
        raise credenciales_invalidas

    usuario = db.scalar(select(Usuario).where(Usuario.usuario_nombre == usuario_nombre))
    if usuario is None or not usuario.activo:
        raise credenciales_invalidas
    return usuario


def requiere_admin(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    if usuario.rol != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol administrador")
    return usuario


def requiere_chofer(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    if usuario.rol != "CHOFER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol chofer")
    return usuario


UsuarioActual = Annotated[Usuario, Depends(get_current_user)]
AdminActual = Annotated[Usuario, Depends(requiere_admin)]
ChoferActual = Annotated[Usuario, Depends(requiere_chofer)]
