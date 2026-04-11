"""FailureService — identifies failure reasons and weak areas using Decision Tree or rule-based fallback."""
from __future__ import annotations

import numpy as np

from backend.core.logging import get_logger
from backend.schemas.failure import FailureRequest, FailureResponse
from backend.services.model_registry import ModelRegistry

logger = get_logger(__name__)


class FailureService:
    """Computes failure_reasons and weak_areas from performance data."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    def predict(self, payload: FailureRequest) -> FailureResponse:
        perf = payload.performance
        scores = [s.score for s in perf.subject_scores]
        avg_score = float(np.mean(scores))
        min_score = float(np.min(scores))
        max_score = float(np.max(scores))
        num_below_50 = sum(1 for s in scores if s < 50)

        # weak_areas: subjects with score < 50 (always computed for correctness property 6)
        weak_areas = [s.subject for s in perf.subject_scores if s.score < 50]

        model = self._registry.get("failure_model")
        if model is not None:
            try:
                features = [[avg_score, min_score, max_score, perf.backlogs, perf.project_failures, num_below_50]]
                prediction = model.predict(features)[0]
                failure_reasons = _class_to_reasons(prediction, perf)
            except Exception as exc:
                logger.warning("failure_model inference failed, using fallback", extra={"error": str(exc)})
                failure_reasons = _rule_based_reasons(avg_score, min_score, perf)
        else:
            failure_reasons = _rule_based_reasons(avg_score, min_score, perf)

        return FailureResponse(failure_reasons=failure_reasons, weak_areas=weak_areas)


def _rule_based_reasons(avg_score: float, min_score: float, perf) -> list[str]:
    reasons = []
    if avg_score < 40:
        reasons.append("Poor overall academic performance")
    if perf.backlogs > 0:
        reasons.append(f"{perf.backlogs} backlog(s) detected")
    if perf.project_failures > 0:
        reasons.append("Project failures impacting placement readiness")
    if min_score < 35:
        reasons.append("Critical weakness in one or more subjects")
    return reasons


def _class_to_reasons(prediction, perf) -> list[str]:
    """Map a Decision Tree class label to human-readable failure reasons."""
    label = str(prediction)
    mapping = {
        "0": [],
        "1": ["Poor overall academic performance"],
        "2": ["Inconsistent performance across subjects"],
        "3": ["Poor overall academic performance", "Critical weakness in one or more subjects"],
    }
    reasons = mapping.get(label, [f"Performance class: {label}"])
    if perf.backlogs > 0:
        reasons.append(f"{perf.backlogs} backlog(s) detected")
    if perf.project_failures > 0:
        reasons.append("Project failures impacting placement readiness")
    return reasons
