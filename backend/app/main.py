from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .config import settings
from .repository import repository


class SimulationRequest(BaseModel):
    policy_family: str = Field(default="queue")
    allocation_family: str = Field(default="uniform")
    budget_k: int = Field(default=10)


app = FastAPI(
    title="Coordination Frictions Toolbox API",
    version="0.1.0",
    summary="Independent policy toolbox backend for the coordination frictions project.",
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


@app.get("/api/baseline/overview")
def baseline_overview() -> dict[str, object]:
    return repository.get_baseline_overview()


@app.get("/api/rankings")
def rankings(limit: int = 20) -> dict[str, object]:
    return repository.get_rankings(limit=limit)


@app.post("/api/simulate")
def simulate(payload: SimulationRequest) -> dict[str, object]:
    try:
        return repository.simulate(
            policy_family=payload.policy_family,
            allocation_family=payload.allocation_family,
            budget_k=payload.budget_k,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/export/report")
def export_report(payload: SimulationRequest) -> dict[str, object]:
    try:
        return repository.export_report(
            policy_family=payload.policy_family,
            allocation_family=payload.allocation_family,
            budget_k=payload.budget_k,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

