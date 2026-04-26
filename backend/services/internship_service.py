"""InternshipService — legacy scoring + new profile-based recommendation."""
from __future__ import annotations

import numpy as np

from backend.core.logging import get_logger
from backend.schemas.internship import (
    CompanyRecommendation, InternshipRequest, InternshipResponse,
    PlacementImpact, ProfileAnalysisResponse, StudentProfile,
)
from backend.services.company_db import get_domain_skills
from backend.services.internship_recommender import recommend_companies, _readiness_score
from backend.services.model_registry import ModelRegistry

logger = get_logger(__name__)


class InternshipService:
    """Legacy internship scoring."""

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
                logger.warning("internship_model inference failed", extra={"error": str(exc)})
                internship_score = _rule_based_score(payload)
        else:
            internship_score = _rule_based_score(payload)

        placement_boost = float(np.clip(internship_score / 10.0, 0.0, 1.0))
        return InternshipResponse(internship_score=internship_score, placement_boost=placement_boost)

    def analyze_profile(self, profile: StudentProfile) -> ProfileAnalysisResponse:
        """Full profile analysis with company recommendations."""
        ats = profile.ats_score or 50.0
        readiness = _readiness_score(profile.cgpa, ats, len(profile.skills), profile.year)

        # Get recommendations
        raw_recs = recommend_companies(
            student_skills=profile.skills,
            domain=profile.target_domain,
            ats_score=ats,
            cgpa=profile.cgpa,
            year=profile.year,
            top_n=10,
        )

        # Convert to schema
        recommendations = []
        for r in raw_recs:
            impact_data = r["placement_impact"]
            recommendations.append(CompanyRecommendation(
                company=r["company"],
                role=r["role"],
                tier=r["tier"],
                tier_label=r["tier_label"],
                match_score=r["match_score"],
                selection_probability=r["selection_probability"],
                required_skills=r["required_skills"],
                matched_skills=r["matched_skills"],
                missing_skills=r["missing_skills"],
                location=r["location"],
                salary_range=r["salary_range"],
                placement_impact=PlacementImpact(
                    level=impact_data["level"],
                    explanation=impact_data["explanation"],
                ),
                reason=r["reason"],
            ))

        # Aggregate missing skills
        all_missing: dict[str, int] = {}
        for r in raw_recs:
            for s in r["missing_skills"]:
                all_missing[s] = all_missing.get(s, 0) + 1
        top_missing = sorted(all_missing, key=lambda x: -all_missing[x])[:6]

        # Strengths
        strengths = _profile_strengths(profile)

        # Suggestions
        suggestions = _improvement_suggestions(profile, readiness, top_missing)

        # Placement impact summary
        impact_summary = _impact_summary(readiness, profile)

        readiness_label = (
            "Excellent" if readiness >= 80 else
            "Good" if readiness >= 60 else
            "Fair" if readiness >= 40 else
            "Needs Improvement"
        )

        return ProfileAnalysisResponse(
            readiness_score=round(readiness, 1),
            readiness_label=readiness_label,
            company_recommendations=recommendations,
            placement_impact_summary=impact_summary,
            improvement_suggestions=suggestions,
            top_missing_skills=top_missing,
            profile_strengths=strengths,
        )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _rule_based_score(payload: InternshipRequest) -> float:
    base = (
        payload.duration_months * 0.5
        + (4 - payload.company_tier) * 1.5
        + payload.role_relevance * 2.0
        + payload.project_count * 0.5
    )
    return float(np.clip(base, 0.0, 10.0))


def _profile_strengths(profile: StudentProfile) -> list[str]:
    strengths = []
    if profile.cgpa >= 8.0:
        strengths.append(f"Strong academic record (CGPA {profile.cgpa})")
    if len(profile.skills) >= 8:
        strengths.append(f"Diverse skill set ({len(profile.skills)} skills)")
    if profile.project_count >= 3:
        strengths.append(f"Good project portfolio ({profile.project_count} projects)")
    if profile.year >= 3:
        strengths.append("Advanced year — more competitive for internships")
    if (profile.ats_score or 0) >= 70:
        strengths.append("Strong resume (ATS score ≥ 70)")
    if not strengths:
        strengths.append("Motivated to build your career — great starting point!")
    return strengths


def _improvement_suggestions(
    profile: StudentProfile,
    readiness: float,
    top_missing: list[str],
) -> list[str]:
    suggestions = []
    if profile.cgpa < 7.0:
        suggestions.append("📚 Improve CGPA above 7.0 — most MNCs have a CGPA cutoff")
    if len(profile.skills) < 5:
        suggestions.append("🛠️ Add more technical skills to your profile")
    if profile.project_count < 2:
        suggestions.append("💡 Build at least 2–3 projects to demonstrate practical skills")
    if (profile.ats_score or 0) < 60:
        suggestions.append("📄 Improve your resume ATS score — use the Resume Analyzer")
    if top_missing:
        suggestions.append(f"🎯 Learn these in-demand skills: {', '.join(top_missing[:4])}")
    if profile.year == 1:
        suggestions.append("🌱 Focus on building fundamentals — apply for startup internships first")
    if readiness < 40:
        suggestions.append("🚀 Start with open-source contributions to build your portfolio")
    return suggestions or ["✅ Your profile looks strong — apply confidently!"]


def _impact_summary(readiness: float, profile: StudentProfile) -> str:
    domain = profile.target_domain
    if readiness >= 75:
        return f"A {domain} internship at a top company will significantly boost your placement chances by 30–50%."
    elif readiness >= 50:
        return f"A {domain} internship will provide valuable experience and improve placement probability by 15–25%."
    else:
        return f"Any {domain} internship experience will build your foundation and make you more competitive for placements."
