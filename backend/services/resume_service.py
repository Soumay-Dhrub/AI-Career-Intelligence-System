"""ResumeService — scores resume against job description using TF-IDF + BERT."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.schemas.resume import ResumeRequest, ResumeResponse
from backend.services.model_registry import ModelRegistry

logger = get_logger(__name__)

# Load skills vocabulary once at module level
_SKILLS_VOCAB: list[str] = []
try:
    _vocab_path = Path(settings.SKILLS_VOCAB_PATH)
    if _vocab_path.exists():
        _SKILLS_VOCAB = json.loads(_vocab_path.read_text())
except Exception as exc:
    logger.warning("Could not load skills vocab", extra={"error": str(exc)})


class ResumeService:
    """Computes resume_score, keyword_match, and missing_skills."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    def predict(self, payload: ResumeRequest) -> ResumeResponse:
        resume = payload.resume_text
        jd = payload.job_description

        # --- TF-IDF keyword_match ---
        tfidf_model = self._registry.get("resume_tfidf")
        keyword_match = _tfidf_similarity(resume, jd, tfidf_model)

        # --- BERT semantic score ---
        bert_model = self._registry.get("resume_bert")
        if bert_model is not None:
            try:
                embeddings = bert_model.encode([resume, jd])
                bert_score = float(cosine_similarity([embeddings[0]], [embeddings[1]])[0][0])
                bert_score = float(np.clip(bert_score, 0.0, 1.0))
            except Exception as exc:
                logger.warning("BERT inference failed, using TF-IDF fallback", extra={"error": str(exc)})
                bert_score = keyword_match / 100.0
        else:
            bert_score = keyword_match / 100.0

        # --- Combined resume_score ---
        resume_score = float(np.clip(0.4 * (keyword_match / 100.0) + 0.6 * bert_score, 0.0, 1.0))

        # --- missing_skills ---
        resume_lower = resume.lower()
        jd_lower = jd.lower()
        missing_skills = [
            skill for skill in _SKILLS_VOCAB
            if skill.lower() in jd_lower and skill.lower() not in resume_lower
        ]

        return ResumeResponse(
            resume_score=resume_score,
            keyword_match=float(np.clip(keyword_match, 0.0, 100.0)),
            missing_skills=missing_skills,
        )


def _tfidf_similarity(resume: str, jd: str, fitted_vectorizer=None) -> float:
    """Compute TF-IDF cosine similarity between resume and job description."""
    try:
        if fitted_vectorizer is not None:
            vecs = fitted_vectorizer.transform([resume, jd])
        else:
            vectorizer = TfidfVectorizer(stop_words="english")
            vecs = vectorizer.fit_transform([resume, jd])
        if vecs.shape[1] == 0:
            return 0.0
        sim = cosine_similarity(vecs[0], vecs[1])[0][0]
        return float(np.clip(sim * 100.0, 0.0, 100.0))
    except Exception as exc:
        logger.warning("TF-IDF similarity failed", extra={"error": str(exc)})
        return 0.0
