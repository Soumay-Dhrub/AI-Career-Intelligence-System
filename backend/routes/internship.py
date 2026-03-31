"""Internship scoring endpoint — POST /internship."""
from fastapi import APIRouter, Request

from backend.schemas.internship import InternshipRequest, InternshipResponse
from backend.services.internship_service import InternshipService

router = APIRouter(tags=["internship"])


@router.post("/internship", response_model=InternshipResponse)
async def internship(payload: InternshipRequest, request: Request) -> InternshipResponse:
    """Score internship experience and return placement boost."""
    registry = request.app.state.registry
    return InternshipService(registry).predict(payload)
