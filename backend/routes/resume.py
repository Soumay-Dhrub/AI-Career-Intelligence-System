"""Resume analysis endpoint — POST /resume."""
from fastapi import APIRouter, Request

from backend.schemas.resume import ResumeRequest, ResumeResponse
from backend.services.resume_service import ResumeService

router = APIRouter(tags=["resume"])


@router.post("/resume", response_model=ResumeResponse)
async def resume(payload: ResumeRequest, request: Request) -> ResumeResponse:
    """Score resume against job description and return missing skills."""
    registry = request.app.state.registry
    return ResumeService(registry).predict(payload)
