"""Orchestrator endpoint — POST /analyze."""
from fastapi import APIRouter, Request

from backend.schemas.analyze import AnalyzeRequest, PlacementReport
from backend.services.orchestrator_service import OrchestratorService

router = APIRouter(tags=["analyze"])


@router.post("/analyze", response_model=PlacementReport)
async def analyze(payload: AnalyzeRequest, request: Request) -> PlacementReport:
    """Run the full placement readiness pipeline and return a PlacementReport."""
    registry = request.app.state.registry
    return OrchestratorService(registry).analyze(payload)
