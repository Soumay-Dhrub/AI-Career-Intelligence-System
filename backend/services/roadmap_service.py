"""RoadmapService — generates a personalized learning roadmap from skill gaps."""
from __future__ import annotations

from backend.core.logging import get_logger
from backend.schemas.roadmap import Milestone, RoadmapRequest, RoadmapResponse
from backend.services.model_registry import ModelRegistry

logger = get_logger(__name__)

RESOURCE_MAP: dict[str, list[str]] = {
    "Python": ["https://docs.python.org", "https://realpython.com"],
    "Java": ["https://dev.java/learn", "https://www.baeldung.com"],
    "JavaScript": ["https://javascript.info", "https://developer.mozilla.org/en-US/docs/Web/JavaScript"],
    "Machine Learning": ["https://scikit-learn.org/stable/tutorial", "https://www.coursera.org/learn/machine-learning"],
    "Deep Learning": ["https://www.deeplearning.ai", "https://pytorch.org/tutorials"],
    "SQL": ["https://www.w3schools.com/sql", "https://mode.com/sql-tutorial"],
    "Docker": ["https://docs.docker.com/get-started", "https://www.youtube.com/watch?v=fqMOX6JJhGo"],
    "Kubernetes": ["https://kubernetes.io/docs/tutorials", "https://www.cncf.io/certification/training"],
    "System Design": ["https://github.com/donnemartin/system-design-primer"],
    "Data Structures": ["https://www.geeksforgeeks.org/data-structures", "https://leetcode.com"],
    "Algorithms": ["https://www.geeksforgeeks.org/fundamentals-of-algorithms", "https://leetcode.com"],
    "AWS": ["https://aws.amazon.com/training", "https://www.coursera.org/learn/aws-fundamentals"],
    "FastAPI": ["https://fastapi.tiangolo.com/tutorial", "https://realpython.com/fastapi-python-web-apis"],
    "React": ["https://react.dev/learn", "https://www.freecodecamp.org/learn/front-end-development-libraries"],
    "PostgreSQL": ["https://www.postgresql.org/docs/current/tutorial.html", "https://www.postgresqltutorial.com"],
}

_DEFAULT_RESOURCES_TEMPLATE = [
    "https://www.google.com/search?q={skill}+tutorial",
    "https://www.youtube.com/results?search_query={skill}+tutorial",
]


class RoadmapService:
    """Generates a prioritized learning roadmap based on skill gaps."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    def predict(self, payload: RoadmapRequest) -> RoadmapResponse:
        gap = payload.skill_gap
        current = {s.lower() for s in gap.current_skills}
        missing = [s for s in gap.target_skills if s.lower() not in current]

        if not missing:
            return RoadmapResponse(roadmap=[])

        model = self._registry.get("roadmap_model")
        if model is not None:
            try:
                # Collaborative filtering: model returns priority scores per skill
                ranked = _cf_rank(model, missing)
            except Exception as exc:
                logger.warning("roadmap_model inference failed, using fallback", extra={"error": str(exc)})
                ranked = missing
        else:
            ranked = missing

        milestones = []
        for priority, skill in enumerate(ranked, start=1):
            resources = RESOURCE_MAP.get(
                skill,
                [r.replace("{skill}", skill.replace(" ", "+")) for r in _DEFAULT_RESOURCES_TEMPLATE],
            )
            milestones.append(Milestone(skill=skill, resources=resources, priority=priority))

        # Ensure sorted by priority ascending
        milestones.sort(key=lambda m: m.priority)
        return RoadmapResponse(roadmap=milestones)


def _cf_rank(model, skills: list[str]) -> list[str]:
    """Use collaborative filtering model to rank skills by priority."""
    # Encode skills as indices and get predicted scores
    scores = model.predict([[i] for i in range(len(skills))])
    ranked = [s for _, s in sorted(zip(scores, skills))]
    return ranked
