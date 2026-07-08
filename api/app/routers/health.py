from __future__ import annotations

from fastapi import APIRouter, Request

from ..schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def get_health(request: Request) -> HealthResponse:
    model = getattr(request.app.state, "model", None)
    return HealthResponse(status="ok", model_loaded=model is not None)
