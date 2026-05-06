from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .repository import repository


app = FastAPI(
    title="Connected Lock Pressure Companion API",
    version="0.2.0",
    summary="Read-only companion backend for connected lock pressure evidence and public aggregate snapshots.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": settings.app_mode}


@app.get("/api/meta/locks")
def meta_locks() -> dict[str, object]:
    return {"items": repository.get_locks()}


@app.get("/api/meta/corridors")
def meta_corridors() -> dict[str, object]:
    return {"items": repository.get_corridors()}


@app.get("/api/network")
def network() -> dict[str, object]:
    return repository.get_network()


@app.get("/api/paper/evidence")
def paper_evidence() -> dict[str, object]:
    return repository.get_paper_evidence()
