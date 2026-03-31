"""Burnout analysis endpoint — POST /burnout."""
from fastapi import APIRouter, Request

from backend.schemas.burnout import BurnoutRequest, BurnoutResponse
from backend.services.burnout_service import BurnoutService

router = APIRouter(tags=["burnout"])


@router.post("/burnout", response_model=BurnoutResponse)
async def burnout(payload: BurnoutRequest, request: Request) -> BurnoutResponse:
    """Analyze study logs and return consistency score and burnout risk."""
    registry = request.app.state.registry
    return BurnoutService(registry).predict(payload)
