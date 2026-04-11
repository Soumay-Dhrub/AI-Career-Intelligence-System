"""InternshipService — scores internship experience using Random Forest or rule-based fallback."""
from __future__ import annotations

import numpy as np

from backend.core.logging import get_logger
from backend.schemas.internship import InternshipRequest, InternshipResponse
from backend.services.model_registry import ModelRegistry

logger = get_logger(__name__)


class InternshipService:
    """Computes internship_score and placement_boost."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    def predict(self, payload: InternshipRequest) -> InternshipResponse:
        features = [
            payload.duration_months,
            payload.company_tier,
            payload.role_relevance,
            payload.project_count,
        ]

        model = self._registry.get("internship_model")
        if model is not None:
            try:
                raw = float(model.predict([features])[0])
                internship_score = float(np.clip(raw, 0.0, 10.0))
            except Exception as exc:
                logger.warning("internship_model inference failed, using fallback", extra={"error": str(exc)})
                internship_score = _rule_based_score(payload)
        else:
            internship_score = _rule_based_score(payload)

        placement_boost = float(np.clip(internship_score / 10.0, 0.0, 1.0))
        return InternshipResponse(internship_score=internship_score, placement_boost=placement_boost)


def _rule_based_score(payload: InternshipRequest) -> float:
    base = (
        payload.duration_months * 0.5
        + (4 - payload.company_tier) * 1.5
        + payload.role_relevance * 2.0
        + payload.project_count * 0.5
    )
    return float(np.clip(base, 0.0, 10.0))
