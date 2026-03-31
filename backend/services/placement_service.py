"""PlacementService — computes final placement probability from aggregated features."""
from __future__ import annotations

from typing import Literal

from backend.core.logging import get_logger
from backend.services.model_registry import ModelRegistry

logger = get_logger(__name__)

RiskLevel = Literal["Low", "Medium", "High"]


def _risk_level(probability: float) -> RiskLevel:
    """Derive risk_level from placement_probability thresholds."""
    if probability < 0.4:
        return "High"
    elif probability <= 0.7:
        return "Medium"
    return "Low"


class PlacementService:
    """Computes placement probability using XGBoost or rule-based fallback."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    def predict(self, features: dict) -> tuple[float, RiskLevel]:
        """Return (placement_probability, risk_level).

        features keys:
            consistency_score, resume_score, internship_score,
            placement_boost, burnout_risk_encoded, avg_subject_score
        """
        consistency_score = features["consistency_score"]
        resume_score = features["resume_score"]
        internship_score = features["internship_score"]
        placement_boost = features["placement_boost"]
        burnout_risk_encoded = features["burnout_risk_encoded"]
        avg_subject_score = features["avg_subject_score"]

        feature_vector = [
            consistency_score,
            resume_score,
            internship_score,
            placement_boost,
            burnout_risk_encoded,
            avg_subject_score,
        ]

        model = self._registry.get("placement_model")
        if model is not None:
            try:
                probability = float(model.predict_proba([feature_vector])[0][1])
            except Exception as exc:
                logger.warning("placement_model inference failed, using fallback", extra={"error": str(exc)})
                probability = _rule_based_probability(
                    consistency_score, resume_score, internship_score,
                    placement_boost, avg_subject_score,
                )
        else:
            probability = _rule_based_probability(
                consistency_score, resume_score, internship_score,
                placement_boost, avg_subject_score,
            )

        probability = min(1.0, max(0.0, probability))
        return probability, _risk_level(probability)


def _rule_based_probability(
    consistency_score: float,
    resume_score: float,
    internship_score: float,
    placement_boost: float,
    avg_subject_score: float,
) -> float:
    score = (
        consistency_score * 0.2
        + resume_score * 0.25
        + (internship_score / 10) * 0.2
        + placement_boost * 0.15
        + (avg_subject_score / 100) * 0.2
    )
    return min(1.0, max(0.0, score))
