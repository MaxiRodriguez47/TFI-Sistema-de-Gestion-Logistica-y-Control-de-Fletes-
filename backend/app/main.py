"""Punto de entrada de la API."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (registra los modelos en el metadata)
from .database import Base, engine
from .routers import auth, camiones, choferes, fincas, ingenios, productos, usuarios, viajes

API_PREFIX = "/api/v1"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Crea las tablas si la base todavía no existe.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sistema de Gestión Logística y Control de Fletes",
    description=(
        "API REST para la digitalización del transporte de caña de azúcar: "
        "fincas, productores, camiones, choferes, ingenios y liquidación de viajes."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for modulo in (auth, fincas, productos, camiones, choferes, ingenios, viajes, usuarios):
    app.include_router(modulo.router, prefix=API_PREFIX)


@app.get("/", tags=["Inicio"], summary="Información de la API")
def inicio():
    return {
        "sistema": "Gestión Logística y Control de Fletes de Caña de Azúcar",
        "version": app.version,
        "documentacion": "/docs",
        "api": API_PREFIX,
    }


@app.get("/health", tags=["Inicio"], summary="Estado del servicio")
def estado():
    return {"status": "ok"}
