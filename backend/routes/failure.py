"""Failure analysis endpoints — legacy + new intelligent analysis."""
from fastapi import APIRouter, Request

from backend.schemas.failure import (
    FailureIntelligenceResponse, FailureRequest, FailureResponse, StudentAssessment,
)
from backend.services.failure_service import FailureService

router = APIRouter(tags=["failure"])


@router.post("/failure", response_model=FailureResponse)
async def failure_legacy(payload: FailureRequest, request: Request) -> FailureResponse:
    """Legacy: analyze subject scores and return failure reasons."""
    registry = request.app.state.registry
    return FailureService(registry).predict(payload)


@router.post("/failure/analyze", response_model=FailureIntelligenceResponse)
async def failure_analyze(payload: StudentAssessment, request: Request) -> FailureIntelligenceResponse:
    """Intelligent failure analysis with root causes, roadmap, and company readiness."""
    registry = request.app.state.registry
    return FailureService(registry).analyze(payload)
