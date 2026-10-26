"""Conexión a la base de datos SQLite y sesión de SQLAlchemy."""

import os
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATABASE_URL = f"sqlite:///{(BASE_DIR / 'logistica_agro.db').as_posix()}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

if DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _activar_claves_foraneas(dbapi_connection, _connection_record) -> None:
        """SQLite no valida las FK por defecto: se activan en cada conexión."""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Clase base declarativa de todos los modelos."""


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI que entrega una sesión por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
