"""Roadmap generation endpoint — POST /roadmap."""
from fastapi import APIRouter, Request

from backend.schemas.roadmap import RoadmapRequest, RoadmapResponse
from backend.services.roadmap_service import RoadmapService

router = APIRouter(tags=["roadmap"])


@router.post("/roadmap", response_model=RoadmapResponse)
async def roadmap(payload: RoadmapRequest, request: Request) -> RoadmapResponse:
    """Generate a personalized learning roadmap from skill gaps."""
    registry = request.app.state.registry
    return RoadmapService(registry).predict(payload)
