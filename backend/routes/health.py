"""Health check endpoint — GET /health."""
from fastapi import APIRouter, Request

from backend.schemas.health import HealthResponse, ModelStatus
from backend.services.model_registry import ModelRegistry

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    """Return HTTP 200 with the status of all ML model artifacts."""
    registry: ModelRegistry = request.app.state.registry
    models = [
        ModelStatus(name=name, status=status)
        for name, status in registry.status().items()
    ]
    return HealthResponse(status="ok", models=models)
