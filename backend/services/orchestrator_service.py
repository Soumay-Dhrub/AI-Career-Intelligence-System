"""OrchestratorService — calls all six ML services and assembles PlacementReport."""
from __future__ import annotations

from fastapi import HTTPException

from backend.schemas.analyze import AnalyzeRequest, PlacementReport
from backend.schemas.burnout import BurnoutRequest
from backend.schemas.failure import FailureRequest
from backend.schemas.resume import ResumeRequest
from backend.schemas.roadmap import RoadmapRequest
from backend.services.burnout_service import BurnoutService
from backend.services.failure_service import FailureService
from backend.services.internship_service import InternshipService
from backend.services.model_registry import ModelRegistry
from backend.services.placement_service import PlacementService
from backend.services.resume_service import ResumeService
from backend.services.roadmap_service import RoadmapService


class OrchestratorService:
    """Orchestrates all six ML services and returns a unified PlacementReport."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    def analyze(self, payload: AnalyzeRequest) -> PlacementReport:
        # 1. Burnout
        try:
            burnout_result = BurnoutService(self._registry).predict(
                BurnoutRequest(study_log=payload.study_log)
            )
        except Exception as e:
            raise HTTPException(500, {"failed_service": "BurnoutService", "error": str(e)})

        # 2. Resume
        try:
            resume_result = ResumeService(self._registry).predict(
                ResumeRequest(resume_text=payload.resume_text, job_description=payload.job_description)
            )
        except Exception as e:
            raise HTTPException(500, {"failed_service": "ResumeService", "error": str(e)})

        # 3. Internship
        try:
            internship_result = InternshipService(self._registry).predict(payload.internship)
        except Exception as e:
            raise HTTPException(500, {"failed_service": "InternshipService", "error": str(e)})

        # 4. Failure
        try:
            failure_result = FailureService(self._registry).predict(
                FailureRequest(performance=payload.performance)
            )
        except Exception as e:
            raise HTTPException(500, {"failed_service": "FailureService", "error": str(e)})

        # 5. Roadmap
        try:
            roadmap_result = RoadmapService(self._registry).predict(
                RoadmapRequest(skill_gap=payload.skill_gap)
            )
        except Exception as e:
            raise HTTPException(500, {"failed_service": "RoadmapService", "error": str(e)})

        # 6. Placement — aggregate features from all services
        avg_subject_score = (
            sum(s.score for s in payload.performance.subject_scores)
            / len(payload.performance.subject_scores)
        )
        burnout_encoded = {"Low": 0, "Medium": 1, "High": 2}[burnout_result.burnout_risk]
        features = {
            "consistency_score": burnout_result.consistency_score,
            "resume_score": resume_result.resume_score,
            "internship_score": internship_result.internship_score,
            "placement_boost": internship_result.placement_boost,
            "burnout_risk_encoded": burnout_encoded,
            "avg_subject_score": avg_subject_score,
        }
        try:
            placement_probability, risk_level = PlacementService(self._registry).predict(features)
        except Exception as e:
            raise HTTPException(500, {"failed_service": "PlacementService", "error": str(e)})

        return PlacementReport(
            consistency_score=burnout_result.consistency_score,
            burnout_risk=burnout_result.burnout_risk,
            resume_score=resume_result.resume_score,
            missing_skills=resume_result.missing_skills,
            internship_score=internship_result.internship_score,
            placement_boost=internship_result.placement_boost,
            failure_reasons=failure_result.failure_reasons,
            weak_areas=failure_result.weak_areas,
            roadmap=roadmap_result.roadmap,
            placement_probability=placement_probability,
            risk_level=risk_level,
        )
