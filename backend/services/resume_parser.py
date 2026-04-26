"""Resume parser — extracts text from PDF, DOCX, or plain text."""
from __future__ import annotations

import io
import re

from backend.core.logging import get_logger

logger = get_logger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF (fitz)."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return _clean(text)
    except ImportError:
        pass

    # Fallback: pdfminer
    try:
        from pdfminer.high_level import extract_text_to_fp
        from pdfminer.layout import LAParams
        output = io.StringIO()
        extract_text_to_fp(io.BytesIO(file_bytes), output, laparams=LAParams())
        return _clean(output.getvalue())
    except Exception as exc:
        logger.warning("PDF extraction failed", extra={"error": str(exc)})
        return ""


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join(p.text for p in doc.paragraphs)
        return _clean(text)
    except Exception as exc:
        logger.warning("DOCX extraction failed", extra={"error": str(exc)})
        return ""


def extract_skills(text: str, skills_vocab: list[str]) -> list[str]:
    """Extract skills present in text using vocab matching."""
    text_lower = text.lower()
    found = []
    for skill in skills_vocab:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return found


def extract_sections(text: str) -> dict[str, str]:
    """Heuristically split resume into sections."""
    section_headers = [
        "experience", "education", "skills", "projects",
        "summary", "objective", "certifications", "achievements",
    ]
    sections: dict[str, list[str]] = {"other": []}
    current = "other"

    for line in text.split("\n"):
        stripped = line.strip().lower()
        matched = next((h for h in section_headers if stripped.startswith(h)), None)
        if matched and len(stripped) < 30:
            current = matched
            sections.setdefault(current, [])
        else:
            sections.setdefault(current, []).append(line)

    return {k: "\n".join(v).strip() for k, v in sections.items()}


def _clean(text: str) -> str:
    """Normalize whitespace and remove junk characters."""
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)   # non-ASCII
    text = re.sub(r'\s+', ' ', text)               # collapse whitespace
    return text.strip()
