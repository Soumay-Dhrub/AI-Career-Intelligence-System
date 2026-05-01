"""Internship endpoints — legacy scoring + new profile analysis + recommendations."""
from fastapi import APIRouter, Request

from backend.schemas.internship import (
    InternshipRequest, InternshipResponse,
    ProfileAnalysisResponse, StudentProfile,
)
from backend.services.internship_service import InternshipService

router = APIRouter(tags=["internship"])


@router.post("/internship", response_model=InternshipResponse)
async def internship_score(payload: InternshipRequest, request: Request) -> InternshipResponse:
    """Legacy: score internship experience and return placement boost."""
    registry = request.app.state.registry
    return InternshipService(registry).predict(payload)


@router.post("/internship/analyze", response_model=ProfileAnalysisResponse)
async def analyze_profile(payload: StudentProfile, request: Request) -> ProfileAnalysisResponse:
    """Analyze student profile and return company recommendations + readiness score."""
    registry = request.app.state.registry
    return InternshipService(registry).analyze_profile(payload)
