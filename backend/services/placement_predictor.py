"""PlacementPredictor — intelligent multi-module placement prediction engine."""
from __future__ import annotations

import numpy as np
from typing import Optional

from backend.core.logging import get_logger
from backend.schemas.placement import (
    CompanyReadinessItem, ModuleScores, PlacementAnalysisRequest,
    PlacementPrediction, PriorityAction, WhatIfScenario,
)

logger = get_logger(__name__)

# ── Company requirements ──────────────────────────────────────────────────────
COMPANY_REQS = {
    "amazon":    {"min_score": 72, "critical": ["Data Structures", "Algorithms", "System Design", "OOP"], "weeks": 12},
    "google":    {"min_score": 82, "critical": ["Data Structures", "Algorithms", "System Design", "Math"], "weeks": 20},
    "microsoft": {"min_score": 70, "critical": ["Data Structures", "Algorithms", "OOP", "System Design"], "weeks": 14},
    "meta":      {"min_score": 78, "critical": ["Data Structures", "Algorithms", "System Design"], "weeks": 16},
    "infosys":   {"min_score": 52, "critical": ["OOP", "SQL", "Java"], "weeks": 6},
    "tcs":       {"min_score": 48, "critical": ["OOP", "SQL", "Java", "Communication"], "weeks": 4},
    "wipro":     {"min_score": 50, "critical": ["OOP", "SQL", "Python"], "weeks": 5},
    "accenture": {"min_score": 50, "critical": ["OOP", "Communication", "SQL"], "weeks": 5},
}


class PlacementPredictor:
    """Aggregates module scores and generates placement prediction."""

    def predict(self, inp: PlacementAnalysisRequest) -> PlacementPrediction:
        # ── 1. Normalize module scores ────────────────────────────────────────
        core = _core_score(inp)
        resume = float(np.clip(inp.ats_score, 0, 100))
        failure = float(np.clip(100 - inp.failure_risk, 0, 100))
        internship = float(np.clip((inp.internship_score / 10.0) * 100, 0, 100))
        consistency = float(np.clip(inp.consistency_score * 100, 0, 100))

        module_scores = ModuleScores(
            core_assessment=round(core, 1),
            resume_ats=round(resume, 1),
            failure_risk=round(failure, 1),
            internship_readiness=round(internship, 1),
            roadmap_consistency=round(consistency, 1),
        )

        # ── 2. Weighted placement score ───────────────────────────────────────
        raw = (
            core        * 0.25
            + resume    * 0.20
            + failure   * 0.20
            + internship * 0.15
            + consistency * 0.20
        )

        # Normalize to realistic 40–88 range
        placement_score = float(np.clip(40 + (raw / 100) * 48, 40, 88))

        # Breakdown
        breakdown = {
            "Core Assessment (25%)":     round(core * 0.25, 1),
            "Resume ATS (20%)":          round(resume * 0.20, 1),
            "Failure Analysis (20%)":    round(failure * 0.20, 1),
            "Internship (15%)":          round(internship * 0.15, 1),
            "Consistency (20%)":         round(consistency * 0.20, 1),
        }

        # ── 3. Readiness level ────────────────────────────────────────────────
        if placement_score >= 80:
            readiness = "Ready"
        elif placement_score >= 65:
            readiness = "Almost Ready"
        elif placement_score >= 50:
            readiness = "Needs Improvement"
        else:
            readiness = "Not Ready"

        # ── 4. Selection probability & risk ──────────────────────────────────
        selection_prob = float(np.clip(placement_score * 0.9 + np.random.uniform(-2, 2), 30, 90))
        risk = "Low" if placement_score >= 70 else "Medium" if placement_score >= 52 else "High"

        # ── 5. Confidence score ───────────────────────────────────────────────
        # Higher confidence when scores are consistent across modules
        scores_arr = [core, resume, failure, internship, consistency]
        std = float(np.std(scores_arr))
        confidence = float(np.clip(90 - std * 0.5, 55, 92))

        # ── 6. Strengths & weaknesses ─────────────────────────────────────────
        strengths, weaknesses = _strengths_weaknesses(inp, module_scores)

        # ── 7. Smart insights ─────────────────────────────────────────────────
        insights = _smart_insights(inp, placement_score, module_scores)

        # ── 8. Root causes ────────────────────────────────────────────────────
        root_causes = _root_causes(inp, module_scores)

        # ── 9. Skill gaps ─────────────────────────────────────────────────────
        skill_gaps = list(set(inp.missing_skills + inp.weak_areas))[:10]
        top_missing = inp.missing_skills[:5]

        # ── 10. Company readiness ─────────────────────────────────────────────
        company_readiness = _company_readiness(inp, placement_score)

        # ── 11. Priority actions ──────────────────────────────────────────────
        actions = _priority_actions(inp, module_scores, placement_score)

        # ── 12. Weekly plan ───────────────────────────────────────────────────
        weekly = _weekly_plan(inp, module_scores)

        # ── 13. What-if scenarios ─────────────────────────────────────────────
        what_if = _what_if(inp, placement_score, module_scores)

        # ── 14. Mentor summary ────────────────────────────────────────────────
        summary = _mentor_summary(placement_score, readiness, root_causes, inp)
        next_step = actions[0].action if actions else "Start with DSA fundamentals"

        return PlacementPrediction(
            placement_score=round(placement_score, 1),
            readiness_level=readiness,
            selection_probability=round(selection_prob, 1),
            risk_level=risk,
            confidence_score=round(confidence, 1),
            module_scores=module_scores,
            score_breakdown=breakdown,
            strengths=strengths,
            weaknesses=weaknesses,
            smart_insights=insights,
            root_causes=root_causes,
            skill_gaps=skill_gaps,
            top_missing_skills=top_missing,
            company_readiness=company_readiness,
            priority_actions=actions,
            weekly_plan=weekly,
            what_if_scenarios=what_if,
            mentor_summary=summary,
            next_step=next_step,
        )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _core_score(inp: PlacementAnalysisRequest) -> float:
    return float(np.clip(
        inp.dsa_score * 0.35
        + inp.coding_ability * 0.30
        + inp.aptitude_score * 0.20
        + inp.verbal_score * 0.15,
        0, 100
    ))


def _strengths_weaknesses(inp: PlacementAnalysisRequest, m: ModuleScores):
    strengths, weaknesses = [], []
    if m.core_assessment >= 65:
        strengths.append(f"Strong core skills (DSA + coding score: {m.core_assessment:.0f}/100)")
    else:
        weaknesses.append(f"Weak core assessment ({m.core_assessment:.0f}/100) — DSA and coding need work")

    if m.resume_ats >= 65:
        strengths.append(f"Good resume quality (ATS: {m.resume_ats:.0f}/100)")
    else:
        weaknesses.append(f"Resume needs improvement (ATS: {m.resume_ats:.0f}/100)")

    if inp.has_internship:
        strengths.append(f"Internship experience — real-world exposure boosts credibility")
    elif inp.year >= 3:
        weaknesses.append("No internship experience — significant disadvantage in year 3+")

    if m.roadmap_consistency >= 65:
        strengths.append(f"Consistent study habits ({m.roadmap_consistency:.0f}/100)")
    else:
        weaknesses.append(f"Inconsistent preparation ({m.roadmap_consistency:.0f}/100) — biggest risk factor")

    if inp.project_count >= 3:
        strengths.append(f"Good project portfolio ({inp.project_count} projects)")
    elif inp.project_count == 0:
        weaknesses.append("No projects — nothing to show in interviews")

    if inp.mock_interviews_done >= 8:
        strengths.append(f"Strong interview practice ({inp.mock_interviews_done} mock interviews)")
    elif inp.mock_interviews_done == 0:
        weaknesses.append("Zero mock interviews — unprepared for real interview pressure")

    return strengths[:4], weaknesses[:4]


def _smart_insights(inp: PlacementAnalysisRequest, score: float, m: ModuleScores) -> list[str]:
    insights = []
    if m.core_assessment >= 70 and inp.project_count < 2:
        insights.append(f"You have strong DSA ({m.core_assessment:.0f}/100) but lack real-world projects — this reduces hiring chances by ~30%.")
    if m.resume_ats < 55:
        insights.append("Resume is your weakest link — a poor ATS score means your resume gets filtered before a human sees it.")
    if m.roadmap_consistency < 45:
        insights.append("High risk due to low consistency — irregular preparation is worse than studying less but consistently.")
    if inp.mock_interviews_done < 3 and score >= 60:
        insights.append(f"You're {score:.0f}% ready but lacking interview practice — skills without interview exposure won't convert to offers.")
    if inp.year == 4 and not inp.has_internship:
        insights.append("Final year with no internship — apply to any internship or freelance project immediately to fill this gap.")
    if m.failure_risk < 50:
        insights.append("Your failure analysis shows critical weak areas — fix these before applying or you'll keep getting rejected.")
    if score >= 70 and inp.target_companies:
        insights.append(f"You're {score:.0f}% ready — start applying to mid-tier companies now while preparing for top-tier ones.")
    if not insights:
        insights.append(f"You're at {score:.0f}/100. Focus on your top 2 weaknesses for the fastest score improvement.")
    return insights[:4]


def _root_causes(inp: PlacementAnalysisRequest, m: ModuleScores) -> list[str]:
    causes = []
    if m.core_assessment < 50:
        causes.append("Weak DSA fundamentals — the primary filter in 90% of tech interviews")
    if m.resume_ats < 55:
        causes.append("Poor resume quality — getting filtered before reaching technical rounds")
    if m.roadmap_consistency < 45:
        causes.append("Inconsistent preparation — no sustained effort over time")
    if inp.project_count < 2:
        causes.append("Insufficient project portfolio — no evidence of practical skills")
    if inp.mock_interviews_done < 3:
        causes.append("No interview practice — technical skills don't translate without practice")
    return causes[:3]


def _company_readiness(inp: PlacementAnalysisRequest, score: float) -> list[CompanyReadinessItem]:
    result = []
    for company in inp.target_companies[:4]:
        c = company.lower().strip()
        req = next((v for k, v in COMPANY_REQS.items() if k in c or c in k), None)
        if not req:
            req = {"min_score": 60, "critical": ["OOP", "SQL", "Communication"], "weeks": 8}

        missing = [s for s in req["critical"] if s.lower() not in " ".join(inp.missing_skills + inp.weak_areas).lower()]
        # Invert: missing from critical means they're NOT in weak areas (they might have them)
        actually_missing = [s for s in req["critical"] if any(s.lower() in m.lower() for m in inp.missing_skills)]

        readiness = float(np.clip(score / req["min_score"] * 100, 10, 98))
        ready = score >= req["min_score"] and len(actually_missing) == 0
        prep_weeks = max(0, req["weeks"] - int((score - 40) / 5)) if not ready else 0

        result.append(CompanyReadinessItem(
            company=company,
            readiness_pct=round(readiness, 1),
            ready=ready,
            missing_skills=actually_missing[:4],
            prep_weeks=prep_weeks,
        ))
    return result


def _priority_actions(inp: PlacementAnalysisRequest, m: ModuleScores, score: float) -> list[PriorityAction]:
    actions = []
    rank = 1

    if m.core_assessment < 60:
        actions.append(PriorityAction(rank=rank, action="Solve 50 Medium LeetCode problems in 3 weeks",
            impact=f"Boosts core score from {m.core_assessment:.0f} → ~75", effort="high", timeline="3 weeks"))
        rank += 1

    if m.resume_ats < 65:
        actions.append(PriorityAction(rank=rank, action=f"Improve resume ATS score from {m.resume_ats:.0f} to 75+",
            impact="Passes automated screening — 3x more interview calls", effort="low", timeline="1 week"))
        rank += 1

    if inp.project_count < 2:
        actions.append(PriorityAction(rank=rank, action="Build 1 real-world deployed project with GitHub link",
            impact="Fills the biggest gap in your portfolio", effort="high", timeline="2–3 weeks"))
        rank += 1

    if inp.mock_interviews_done < 5:
        actions.append(PriorityAction(rank=rank, action="Complete 10 mock interviews on Pramp or with peers",
            impact="Converts skills to actual offers — most students skip this", effort="medium", timeline="2 weeks"))
        rank += 1

    if m.roadmap_consistency < 55:
        actions.append(PriorityAction(rank=rank, action="Commit to 3h/day consistent study — no exceptions",
            impact=f"Consistency score from {m.roadmap_consistency:.0f} → 70+ in 4 weeks", effort="medium", timeline="Ongoing"))
        rank += 1

    return actions[:5]


def _weekly_plan(inp: PlacementAnalysisRequest, m: ModuleScores) -> list[str]:
    plan = []
    if m.core_assessment < 65:
        plan.append("Week 1–2: Arrays, Strings, Linked Lists — 15 problems each")
    if m.resume_ats < 65:
        plan.append("Week 1: Rewrite resume — add metrics, fix ATS keywords, use single-column format")
    if inp.project_count < 2:
        plan.append("Week 2–4: Build and deploy 1 full-stack project — push to GitHub daily")
    plan.append("Week 3–4: Trees, Graphs, Dynamic Programming — 10 problems each")
    plan.append("Week 5–6: System Design basics — URL shortener, Twitter feed, WhatsApp")
    plan.append("Week 7–8: 2 mock interviews/week + STAR behavioral prep")
    return plan[:6]


def _what_if(inp: PlacementAnalysisRequest, score: float, m: ModuleScores) -> list[WhatIfScenario]:
    scenarios = []

    # Scenario 1: Improve DSA
    if m.core_assessment < 75:
        new_core = min(m.core_assessment + 20, 90)
        new_score = score + (new_core - m.core_assessment) * 0.25
        new_score = float(np.clip(40 + (new_score - 40) * 1.0, 40, 88))
        scenarios.append(WhatIfScenario(
            scenario="If you improve DSA score by 20 points",
            current_score=round(score, 1),
            projected_score=round(min(new_score, 88), 1),
            delta=round(min(new_score, 88) - score, 1),
            action="Solve 60 Medium LeetCode problems in 4 weeks",
        ))

    # Scenario 2: Improve resume
    if m.resume_ats < 75:
        new_resume = min(m.resume_ats + 20, 90)
        new_score = score + (new_resume - m.resume_ats) * 0.20
        scenarios.append(WhatIfScenario(
            scenario="If you improve resume ATS score to 75+",
            current_score=round(score, 1),
            projected_score=round(min(new_score, 88), 1),
            delta=round(min(new_score, 88) - score, 1),
            action="Rewrite resume with ATS keywords and quantified achievements",
        ))

    # Scenario 3: Add projects
    if inp.project_count < 3:
        project_boost = (3 - inp.project_count) * 3
        new_score = min(score + project_boost, 88)
        scenarios.append(WhatIfScenario(
            scenario=f"If you build {3 - inp.project_count} more real-world projects",
            current_score=round(score, 1),
            projected_score=round(new_score, 1),
            delta=round(new_score - score, 1),
            action="Build and deploy projects with GitHub links and live demos",
        ))

    return scenarios[:3]


def _mentor_summary(score: float, readiness: str, causes: list[str], inp: PlacementAnalysisRequest) -> str:
    top = causes[0] if causes else "general preparation gaps"
    role = inp.target_role
    if score >= 78:
        return f"You're in strong shape for {role} ({score:.0f}/100). Start applying to your target companies now. Focus on mock interviews to convert readiness into offers."
    elif score >= 62:
        return f"You're almost there for {role} ({score:.0f}/100). Your main blocker is {top.lower()}. Fix this in 3–4 weeks and you'll be competitive."
    else:
        return f"Honest assessment: {score:.0f}/100 is not enough for {role} yet. Your biggest issue is {top.lower()}. Spend 6–8 weeks fixing this before applying."

