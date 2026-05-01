"""Resume analysis endpoints — POST /resume (text) and POST /resume/upload (file)."""
from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status

from backend.schemas.resume import ResumeRequest, ResumeResponse
from backend.services.resume_parser import extract_text_from_docx, extract_text_from_pdf
from backend.services.resume_service import ResumeService
from backend.services.job_roles import list_roles

router = APIRouter(tags=["resume"])

_MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/resume", response_model=ResumeResponse)
async def resume_text(payload: ResumeRequest, request: Request) -> ResumeResponse:
    """Analyze resume text against a job description."""
    registry = request.app.state.registry
    return ResumeService(registry).predict(payload)


@router.post("/resume/upload", response_model=ResumeResponse)
async def resume_upload(
    request: Request,
    file: UploadFile = File(...),
    job_description: str = Form(...),
) -> ResumeResponse:
    """Upload a PDF or DOCX resume and analyze against a job description."""
    if not job_description.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="job_description cannot be empty")

    content_type = file.content_type or ""
    filename = (file.filename or "").lower()

    file_bytes = await file.read()
    if len(file_bytes) > _MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="File too large. Maximum size is 5 MB.")

    # Extract text
    if "pdf" in content_type or filename.endswith(".pdf"):
        resume_text = extract_text_from_pdf(file_bytes)
    elif "docx" in content_type or "word" in content_type or filename.endswith(".docx"):
        resume_text = extract_text_from_docx(file_bytes)
    elif filename.endswith(".doc"):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                            detail="Old .doc format not supported. Please convert to .docx or .pdf")
    else:
        # Try as plain text
        try:
            resume_text = file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                                detail="Unsupported file type. Use PDF or DOCX.")

    if not resume_text.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Could not extract text from the uploaded file.")

    registry = request.app.state.registry
    return ResumeService(registry).predict(
        ResumeRequest(resume_text=resume_text, job_description=job_description)
    )


@router.get("/resume/roles")
async def get_roles() -> dict:
    """Return list of supported job roles."""
    return {"roles": list_roles()}
