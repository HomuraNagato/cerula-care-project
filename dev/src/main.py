from fastapi import FastAPI
from .core.config import get_settings
from .core.db import create_db_and_tables
from .routers import (
    assignments_router,
    care_team_router,
    patients_router,
)

settings = get_settings()

app = FastAPI(
    title="Cerula Care Patient Dashboard API",
    version="0.1.0",
    openapi_prefix=settings.api_prefix,
)

app.include_router(
    patients_router,
    prefix=f"{settings.api_prefix}/patients",
    tags=["patients"],
)

app.include_router(
    assignments_router,
    prefix=settings.api_prefix,
    tags=["assignments"],
)

app.include_router(
    care_team_router,
    prefix=f"{settings.api_prefix}/care-team",
    tags=["care_team"],
)


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


@app.get("/")
def health_check() -> dict:
    return {"status": "ok"}
