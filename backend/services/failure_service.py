"""FailureService — Failure Intelligence System with multi-dimensional analysis."""
from __future__ import annotations

import numpy as np
from typing import Optional

from backend.core.logging import get_logger
from backend.schemas.failure import (
    CompanyReadiness, DimensionScore, FailureIntelligenceResponse,
    FailureRequest, FailureResponse, RootCause, StudentAssessment, WeeklyPlan,
)
from backend.services.failure_knowledge import (
    CONSISTENCY_SCORE, DSA_LEVEL_ORDER, DSA_LEVEL_SCORE,
    PROJECT_TYPE_SCORE, get_company, get_domain,
)
from backend.services.model_registry import ModelRegistry

logger = get_logger(__name__)


class FailureService:
    """Legacy + new intelligent failure analysis."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    # ── Legacy endpoint ───────────────────────────────────────────────────────
    def predict(self, payload: FailureRequest) -> FailureResponse:
        perf = payload.performance
        scores = [s.score for s in perf.subject_scores]
        avg_score = float(np.mean(scores))
        min_score = float(np.min(scores))
        max_score = float(np.max(scores))
        num_below_50 = sum(1 for s in scores if s < 50)
        weak_areas = [s.subject for s in perf.subject_scores if s.score < 50]

        model = self._registry.get("failure_model")
        if model is not None:
            try:
                features = [[avg_score, min_score, max_score, perf.backlogs, perf.project_failures, num_below_50]]
                prediction = model.predict(features)[0]
                failure_reasons = _class_to_reasons(prediction, perf)
            except Exception as exc:
                logger.warning("failure_model inference failed", extra={"error": str(exc)})
                failure_reasons = _rule_based_reasons(avg_score, min_score, perf)
        else:
            failure_reasons = _rule_based_reasons(avg_score, min_score, perf)

        return FailureResponse(failure_reasons=failure_reasons, weak_areas=weak_areas)

    # ── New intelligent analysis ──────────────────────────────────────────────
    def analyze(self, profile: StudentAssessment) -> FailureIntelligenceResponse:
        domain_data = get_domain(profile.domain)

        # ── 1. Compute dimension scores ───────────────────────────────────────
        dsa_score = _score_dsa(profile)
        coding_score = _score_coding(profile)
        aptitude_score = float(np.clip((profile.aptitude_level / 10.0) * 100, 0, 100))
        verbal_score = float(np.clip((profile.verbal_ability / 10.0) * 100, 0, 100))
        project_score = _score_projects(profile)
        consistency_score = float(CONSISTENCY_SCORE.get(profile.consistency, 55))

        dimensions = [
            _dim("DSA & Problem Solving", dsa_score, 0.25, _dsa_insight(profile)),
            _dim("Coding Ability", coding_score, 0.20, _coding_insight(profile)),
            _dim("Aptitude", aptitude_score, 0.15, _aptitude_insight(profile)),
            _dim("Verbal & Communication", verbal_score, 0.10, _verbal_insight(profile)),
            _dim("Projects & Portfolio", project_score, 0.15, _project_insight(profile)),
            _dim("Consistency & Discipline", consistency_score, 0.15, _consistency_insight(profile)),
        ]

        # ── 2. Overall score (weighted) ───────────────────────────────────────
        raw_score = sum(d.score * d.weight for d in dimensions)
        # Normalize to 40–90 range (realistic)
        overall_score = float(np.clip(40 + (raw_score / 100) * 50, 40, 90))

        # ── 3. Failure risk & placement readiness ─────────────────────────────
        failure_risk = _failure_risk(profile, dsa_score, consistency_score, project_score)
        placement_readiness = float(np.clip(100 - failure_risk * 0.7 + overall_score * 0.3, 20, 90))

        # ── 4. Root cause detection ───────────────────────────────────────────
        root_causes = _detect_root_causes(profile, dsa_score, coding_score, consistency_score, project_score)

        # ── 5. Strengths & weaknesses ─────────────────────────────────────────
        strengths = _find_strengths(profile, dimensions)
        weaknesses = _find_weaknesses(profile, dimensions)

        # ── 6. Intelligent insights ───────────────────────────────────────────
        insights = _intelligent_insights(profile, dsa_score, consistency_score, project_score)

        # ── 7. Domain readiness ───────────────────────────────────────────────
        domain_readiness = _domain_readiness(profile, domain_data)

        # ── 8. Company readiness ──────────────────────────────────────────────
        company_readiness = None
        if profile.target_company:
            company_readiness = _company_readiness(profile, dsa_score, project_score)

        # ── 9. Skill gaps ─────────────────────────────────────────────────────
        skill_gaps = _skill_gaps(profile, domain_data)

        # ── 10. Action plan ───────────────────────────────────────────────────
        action_plan = _generate_action_plan(profile, root_causes, skill_gaps, dsa_score)

        # ── 11. Mentor summary ────────────────────────────────────────────────
        mentor_summary = _mentor_summary(overall_score, failure_risk, root_causes, profile)

        return FailureIntelligenceResponse(
            overall_score=round(overall_score, 1),
            failure_risk_pct=round(failure_risk, 1),
            placement_readiness_pct=round(placement_readiness, 1),
            dimensions=dimensions,
            strengths=strengths,
            weaknesses=weaknesses,
            root_causes=root_causes[:3],
            intelligent_insights=insights,
            domain_readiness=domain_readiness,
            company_readiness=company_readiness,
            action_plan=action_plan,
            skill_gaps=skill_gaps,
            mentor_summary=mentor_summary,
        )


# ── Dimension scoring ─────────────────────────────────────────────────────────

def _score_dsa(p: StudentAssessment) -> float:
    base = float(DSA_LEVEL_SCORE.get(p.dsa_level, 20))
    # Bonus for problems solved
    problem_bonus = min(p.dsa_problems_solved / 3, 20)  # 60 problems = +20
    return float(np.clip(base + problem_bonus, 0, 100))


def _score_coding(p: StudentAssessment) -> float:
    base = float(np.clip((p.coding_ability / 10.0) * 100, 0, 100))
    # Bonus for internship
    if p.has_internship:
        base = min(base + 10, 100)
    # Bonus for mock interviews
    mock_bonus = min(p.mock_interviews_done * 3, 15)
    return float(np.clip(base + mock_bonus, 0, 100))


def _score_projects(p: StudentAssessment) -> float:
    type_score = float(PROJECT_TYPE_SCORE.get(p.project_type, 30))
    count_bonus = min(p.project_count * 8, 30)
    internship_bonus = min(p.internship_months * 5, 20) if p.has_internship else 0
    return float(np.clip(type_score * 0.5 + count_bonus + internship_bonus, 0, 100))


def _dim(name: str, score: float, weight: float, insight: str) -> DimensionScore:
    label = "Strong" if score >= 70 else "Average" if score >= 45 else "Weak"
    return DimensionScore(name=name, score=round(score, 1), weight=weight, label=label, insight=insight)


# ── Insights per dimension ────────────────────────────────────────────────────

def _dsa_insight(p: StudentAssessment) -> str:
    if p.dsa_level in ("none", "beginner"):
        return f"Only {p.dsa_problems_solved} problems solved — DSA is the #1 filter in tech interviews"
    if p.dsa_level == "easy":
        return f"{p.dsa_problems_solved} problems at Easy level — need to push to Medium for most companies"
    if p.dsa_level == "medium":
        return f"Good foundation at Medium level with {p.dsa_problems_solved} problems — target Hard for top companies"
    return f"Strong DSA with {p.dsa_problems_solved} problems at Hard level"


def _coding_insight(p: StudentAssessment) -> str:
    if p.mock_interviews_done == 0:
        return "Zero mock interviews — you're practicing in isolation without real pressure simulation"
    if p.mock_interviews_done < 5:
        return f"Only {p.mock_interviews_done} mock interviews — need at least 10–15 to build interview confidence"
    return f"{p.mock_interviews_done} mock interviews done — good interview exposure"


def _aptitude_insight(p: StudentAssessment) -> str:
    if p.aptitude_level <= 4:
        return "Weak aptitude — many companies filter at aptitude round before technical interviews"
    if p.aptitude_level <= 6:
        return "Average aptitude — practice quantitative and logical reasoning daily"
    return "Good aptitude score — maintain with regular practice"


def _verbal_insight(p: StudentAssessment) -> str:
    if p.verbal_ability <= 4:
        return "Poor communication skills — HR rounds and group discussions will be challenging"
    if p.verbal_ability <= 6:
        return "Average verbal ability — work on structured communication for interviews"
    return "Good communication skills — an asset in HR and behavioral rounds"


def _project_insight(p: StudentAssessment) -> str:
    if p.project_count == 0:
        return "No projects — you have nothing to show in interviews. Start building immediately"
    if p.project_type == "basic":
        return f"{p.project_count} basic projects — recruiters want real-world, deployed projects"
    if p.project_type == "real-world":
        return f"{p.project_count} real-world projects — good, add GitHub links and live demos"
    return f"{p.project_count} scalable projects — strong portfolio for top companies"


def _consistency_insight(p: StudentAssessment) -> str:
    hours = p.daily_study_hours
    if p.consistency in ("very_irregular", "irregular"):
        return f"Irregular study pattern with {hours}h/day — inconsistency is the silent career killer"
    if hours < 2:
        return f"Only {hours}h/day — insufficient for competitive preparation"
    if hours >= 5 and p.consistency in ("regular", "very_regular"):
        return f"Excellent: {hours}h/day consistently — this is what separates placed students"
    return f"{hours}h/day with moderate consistency — increase to 4–5h for faster progress"


# ── Failure risk ──────────────────────────────────────────────────────────────

def _failure_risk(p: StudentAssessment, dsa: float, consistency: float, projects: float) -> float:
    risk = 0.0
    if dsa < 30:
        risk += 30
    elif dsa < 50:
        risk += 15
    if consistency < 40:
        risk += 25
    elif consistency < 60:
        risk += 10
    if projects < 30:
        risk += 20
    if p.rejection_count > 3:
        risk += 10
    if p.mock_interviews_done == 0:
        risk += 10
    if not p.has_internship and p.year >= 3:
        risk += 5
    return float(np.clip(risk, 5, 95))


# ── Root cause detection ──────────────────────────────────────────────────────

def _detect_root_causes(
    p: StudentAssessment,
    dsa: float, coding: float, consistency: float, projects: float
) -> list[RootCause]:
    causes = []

    if dsa < 35:
        causes.append(RootCause(
            cause="Weak DSA Fundamentals",
            severity="critical",
            explanation=f"DSA score {dsa:.0f}/100 — most tech companies filter on DSA in round 1",
            fix="Solve 2 LeetCode problems daily. Start with Arrays → Strings → Linked Lists → Trees",
        ))

    if consistency < 40:
        causes.append(RootCause(
            cause="Lack of Consistency",
            severity="critical",
            explanation=f"Irregular study pattern ({p.consistency.replace('_', ' ')}) — preparation requires daily discipline",
            fix="Set a fixed 4-hour daily study block. Use Pomodoro technique. Track on a habit app",
        ))

    if p.project_count == 0 or p.project_type == "basic":
        causes.append(RootCause(
            cause="No Real-World Projects",
            severity="critical" if p.project_count == 0 else "moderate",
            explanation="Basic or no projects signal lack of practical experience to recruiters",
            fix="Build 1 full-stack or domain-specific project with GitHub + live deployment in next 4 weeks",
        ))

    if p.mock_interviews_done < 3:
        causes.append(RootCause(
            cause="No Interview Practice",
            severity="moderate",
            explanation=f"Only {p.mock_interviews_done} mock interviews — interview performance is a skill that needs practice",
            fix="Do 2 mock interviews per week on Pramp, InterviewBit, or with peers",
        ))

    if p.rejection_count > 3 and dsa >= 50:
        causes.append(RootCause(
            cause="Poor Interview Execution",
            severity="moderate",
            explanation=f"{p.rejection_count} rejections despite decent skills — likely failing on communication or problem-solving approach",
            fix="Record yourself solving problems. Practice thinking aloud. Work on structured answers (STAR method)",
        ))

    if p.aptitude_level <= 4:
        causes.append(RootCause(
            cause="Weak Aptitude",
            severity="moderate",
            explanation="Low aptitude score — many companies eliminate candidates at aptitude screening",
            fix="Practice 20 aptitude questions daily on IndiaBix or PrepInsta for 3 weeks",
        ))

    if not p.has_internship and p.year >= 3:
        causes.append(RootCause(
            cause="No Internship Experience",
            severity="moderate",
            explanation="No internship by year 3 — reduces competitiveness significantly",
            fix="Apply to 10+ internships on LinkedIn, Internshala, and AngelList this week",
        ))

    # Sort by severity
    order = {"critical": 0, "moderate": 1, "minor": 2}
    causes.sort(key=lambda x: order[x.severity])
    return causes


# ── Strengths & weaknesses ────────────────────────────────────────────────────

def _find_strengths(p: StudentAssessment, dims: list[DimensionScore]) -> list[str]:
    strengths = []
    for d in dims:
        if d.score >= 70:
            strengths.append(f"{d.name}: {d.insight}")
    if p.has_internship:
        strengths.append(f"Internship experience ({p.internship_months} months) — real-world exposure")
    if p.mock_interviews_done >= 10:
        strengths.append(f"Strong interview practice ({p.mock_interviews_done} mocks)")
    if not strengths:
        strengths.append("Motivated to improve — that's the first step")
    return strengths[:4]


def _find_weaknesses(p: StudentAssessment, dims: list[DimensionScore]) -> list[str]:
    return [f"{d.name} ({d.score:.0f}/100): {d.insight}" for d in dims if d.score < 45][:4]


# ── Intelligent insights ──────────────────────────────────────────────────────

def _intelligent_insights(
    p: StudentAssessment, dsa: float, consistency: float, projects: float
) -> list[str]:
    insights = []

    if dsa < 40 and p.daily_study_hours >= 3:
        insights.append("🔄 You're stuck in a tutorial loop — watching videos without solving problems. Switch to active problem-solving immediately.")

    if p.project_count >= 2 and p.mock_interviews_done == 0:
        insights.append("📦 You have projects but no interview practice — your skills are invisible to recruiters without interview exposure.")

    if p.rejection_count > 5 and dsa < 50:
        insights.append("🎯 Multiple rejections with weak DSA — you're applying before you're ready. Pause applications, fix DSA for 6 weeks, then reapply.")

    if p.project_type == "basic" and p.year >= 3:
        insights.append("⚠️ Your projects are not industry-level. A todo app or calculator won't impress recruiters in year 3. Build something with real users or real data.")

    if p.consistency in ("very_irregular", "irregular") and p.daily_study_hours >= 4:
        insights.append("📉 You study a lot some days and nothing on others — this is worse than studying 2h consistently. Consistency beats intensity.")

    if not p.has_internship and p.year == 4:
        insights.append("🚨 Final year with no internship — this is a red flag for most companies. Prioritize getting any internship or freelance project immediately.")

    if p.dsa_level in ("medium", "hard") and p.project_count == 0:
        insights.append("🧩 Strong DSA but no projects — you can solve problems but can't build. Companies want both. Start a project this week.")

    if p.verbal_ability <= 4 and p.mock_interviews_done >= 5:
        insights.append("🗣️ You're practicing interviews but communication is still weak — focus on structured answers, not just technical correctness.")

    return insights[:4]


# ── Domain readiness ──────────────────────────────────────────────────────────

def _domain_readiness(p: StudentAssessment, domain_data: dict) -> dict[str, float]:
    stack_lower = [s.lower() for s in p.tech_stack]
    result = {}
    for skill in domain_data["core_skills"]:
        covered = any(skill.lower() in s or s in skill.lower() for s in stack_lower)
        result[skill] = 100.0 if covered else 0.0
    return result


# ── Company readiness ─────────────────────────────────────────────────────────

def _company_readiness(p: StudentAssessment, dsa: float, projects: float) -> CompanyReadiness:
    company_data = get_company(p.target_company or "")
    if not company_data:
        return CompanyReadiness(
            company=p.target_company or "Unknown",
            ready=False,
            readiness_pct=50.0,
            missing=["Company not in database — general preparation applies"],
            prep_weeks=8,
            verdict="Prepare DSA + projects for 8 weeks before applying",
        )

    name = company_data.get("name", p.target_company or "")
    critical = company_data["critical_skills"]
    stack_lower = [s.lower() for s in p.tech_stack]
    missing = [s for s in critical if not any(s.lower() in sk or sk in s.lower() for sk in stack_lower)]

    # DSA check
    min_dsa = company_data["min_dsa"]
    dsa_ok = DSA_LEVEL_ORDER.index(p.dsa_level) >= DSA_LEVEL_ORDER.index(min_dsa)
    if not dsa_ok:
        missing.append(f"DSA at {min_dsa} level (currently {p.dsa_level})")

    # Project check
    if p.project_count < company_data["min_projects"]:
        missing.append(f"At least {company_data['min_projects']} projects required")

    readiness_pct = max(0, 100 - len(missing) * 20 - (0 if dsa_ok else 25))
    readiness_pct = float(np.clip(readiness_pct, 10, 95))
    ready = readiness_pct >= 65 and len(missing) == 0

    base_weeks = company_data["prep_weeks_base"]
    prep_weeks = base_weeks + len(missing) * 2

    if ready:
        verdict = f"You're ready to apply to {name}! Polish your resume and start applying."
    elif readiness_pct >= 50:
        verdict = f"Almost ready for {name}. Fix {len(missing)} gaps in {prep_weeks} weeks."
    else:
        verdict = f"Not ready for {name} yet. Need {prep_weeks} weeks of focused preparation."

    return CompanyReadiness(
        company=name,
        ready=ready,
        readiness_pct=round(readiness_pct, 1),
        missing=missing[:6],
        prep_weeks=prep_weeks,
        verdict=verdict,
    )


# ── Skill gaps ────────────────────────────────────────────────────────────────

def _skill_gaps(p: StudentAssessment, domain_data: dict) -> list[str]:
    stack_lower = [s.lower() for s in p.tech_stack]
    gaps = []
    for skill in domain_data["core_skills"] + domain_data["advanced_skills"]:
        if not any(skill.lower() in s or s in skill.lower() for s in stack_lower):
            gaps.append(skill)
    return gaps[:10]


# ── Action plan ───────────────────────────────────────────────────────────────

def _generate_action_plan(
    p: StudentAssessment,
    root_causes: list[RootCause],
    skill_gaps: list[str],
    dsa: float,
) -> list[WeeklyPlan]:
    plan = []
    week = 1

    # Week 1–2: Fix biggest root cause
    if any(c.cause == "Weak DSA Fundamentals" for c in root_causes):
        plan.append(WeeklyPlan(
            week=f"Week {week}–{week+1}",
            focus="DSA Foundations",
            tasks=[
                "Arrays + Strings: 20 problems on LeetCode (Easy)",
                "Linked Lists: 10 problems",
                "Revise time/space complexity for each solution",
                "Read 'Cracking the Coding Interview' Ch. 1–3",
            ],
            daily_target="2 DSA problems + 30 min theory",
        ))
        week += 2

    # Week 3–4: Projects
    if any(c.cause == "No Real-World Projects" for c in root_causes):
        domain_skill = skill_gaps[0] if skill_gaps else p.domain
        plan.append(WeeklyPlan(
            week=f"Week {week}–{week+1}",
            focus=f"Build a Real-World {p.domain} Project",
            tasks=[
                f"Choose a project idea using {domain_skill}",
                "Set up GitHub repo with proper README",
                "Build MVP in 10 days",
                "Deploy on Vercel/Heroku/AWS",
            ],
            daily_target="3h project work + 1h DSA",
        ))
        week += 2

    # Week 5–6: Interview prep
    if any(c.cause == "No Interview Practice" for c in root_causes):
        plan.append(WeeklyPlan(
            week=f"Week {week}–{week+1}",
            focus="Interview Simulation",
            tasks=[
                "2 mock interviews per week on Pramp or with peers",
                "Practice explaining your projects in 2 minutes",
                "Solve 3 medium LeetCode problems under 45-min timer",
                "Prepare STAR answers for 5 behavioral questions",
            ],
            daily_target="1h mock prep + 2 DSA problems",
        ))
        week += 2

    # Week 7+: Domain skills
    if skill_gaps:
        plan.append(WeeklyPlan(
            week=f"Week {week}+",
            focus=f"Domain Skill Building ({p.domain})",
            tasks=[f"Learn {s}" for s in skill_gaps[:4]] + [
                "Build a mini-project using new skills",
                "Add to GitHub and update resume",
            ],
            daily_target=f"2h {p.domain} learning + 1h DSA",
        ))

    return plan[:4]


# ── Mentor summary ────────────────────────────────────────────────────────────

def _mentor_summary(score: float, risk: float, causes: list[RootCause], p: StudentAssessment) -> str:
    top_cause = causes[0].cause if causes else "general preparation gaps"
    if score >= 75:
        return f"You're in good shape with {score:.0f}/100. Your main focus should be {top_cause.lower()}. Keep the momentum — you're close to placement-ready."
    elif score >= 55:
        return f"You have potential but {score:.0f}/100 isn't enough yet. Your biggest blocker is {top_cause.lower()}. Fix this in the next 4 weeks and your chances improve significantly."
    else:
        return f"Honest assessment: at {score:.0f}/100 with {risk:.0f}% failure risk, you need a complete reset. Stop applying, spend 8 weeks on {top_cause.lower()}, then come back stronger."


# ── Legacy helpers ────────────────────────────────────────────────────────────

def _rule_based_reasons(avg_score, min_score, perf) -> list[str]:
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
    label = str(prediction)
    mapping = {
        "0": [], "1": ["Poor overall academic performance"],
        "2": ["Inconsistent performance across subjects"],
        "3": ["Poor overall academic performance", "Critical weakness in one or more subjects"],
    }
    reasons = mapping.get(label, [f"Performance class: {label}"])
    if perf.backlogs > 0:
        reasons.append(f"{perf.backlogs} backlog(s) detected")
    if perf.project_failures > 0:
        reasons.append("Project failures impacting placement readiness")
    return reasons
