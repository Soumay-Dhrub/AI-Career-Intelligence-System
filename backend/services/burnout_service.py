"""BurnoutService — analyzes study logs for consistency and burnout risk."""
from __future__ import annotations

import numpy as np

from backend.core.logging import get_logger
from backend.schemas.burnout import BurnoutRequest, BurnoutResponse
from backend.services.model_registry import ModelRegistry

logger = get_logger(__name__)


class BurnoutService:
    """Computes consistency_score and burnout_risk from study logs."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    def predict(self, payload: BurnoutRequest) -> BurnoutResponse:
        hours = np.array(payload.study_log.daily_hours, dtype=float)

        # --- consistency_score via coefficient of variation ---
        mean_h = float(np.mean(hours))
        std_h = float(np.std(hours))
        if mean_h == 0:
            consistency_score = 0.0
        else:
            coefficient_of_variation = std_h / mean_h
            consistency_score = float(np.clip(1.0 - coefficient_of_variation, 0.0, 1.0))

        # --- burnout_risk ---
        model = self._registry.get("burnout_model")
        if model is not None:
            try:
                features = [[mean_h, std_h, float(np.max(hours)), float(np.min(hours)), consistency_score]]
                if hasattr(model, "predict_proba"):
                    prob = float(model.predict_proba(features)[0][1])
                else:
                    prob = float(model.predict(features)[0])
                burnout_risk = _prob_to_risk(prob)
            except Exception as exc:
                logger.warning("burnout_model inference failed, using fallback", extra={"error": str(exc)})
                burnout_risk = _rule_based_risk(mean_h)
        else:
            burnout_risk = _rule_based_risk(mean_h)

        return BurnoutResponse(consistency_score=consistency_score, burnout_risk=burnout_risk)


def _prob_to_risk(prob: float) -> str:
    if prob < 0.33:
        return "Low"
    elif prob < 0.66:
        return "Medium"
    return "High"


def _rule_based_risk(mean_hours: float) -> str:
    if mean_hours > 8:
        return "High"
    elif mean_hours > 5:
        return "Medium"
    return "Low"
