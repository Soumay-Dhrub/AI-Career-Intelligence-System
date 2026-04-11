"""Failure analysis endpoint — POST /failure."""
from fastapi import APIRouter, Request

from backend.schemas.failure import FailureRequest, FailureResponse
from backend.services.failure_service import FailureService

router = APIRouter(tags=["failure"])


@router.post("/failure", response_model=FailureResponse)
async def failure(payload: FailureRequest, request: Request) -> FailureResponse:
    """Analyze performance data and return failure reasons and weak areas."""
    registry = request.app.state.registry
    return FailureService(registry).predict(payload)
