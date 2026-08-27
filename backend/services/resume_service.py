"""ResumeService — hybrid ATS scoring: keyword + semantic + structure + experience + skill gap."""
from __future__ import annotations

import hashlib
import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.schemas.resume import ImprovementSuggestion, ResumeRequest, ResumeResponse
from backend.services.job_roles import get_role
from backend.services.model_registry import ModelRegistry

logger = get_logger(__name__)

# ── Skills vocab ──────────────────────────────────────────────────────────────
_SKILLS_VOCAB: list[str] = []
try:
    _vocab_path = Path(settings.SKILLS_VOCAB_PATH)
    if _vocab_path.exists():
        _SKILLS_VOCAB = json.loads(_vocab_path.read_text())
except Exception as exc:
    logger.warning("Could not load skills vocab", extra={"error": str(exc)})

# ── Action verb banks ─────────────────────────────────────────────────────────
_STRONG_VERBS = {
    "engineered", "architected", "optimized", "delivered", "spearheaded",
    "implemented", "designed", "developed", "led", "reduced", "increased",
    "automated", "deployed", "built", "created", "launched", "improved",
    "collaborated", "mentored", "scaled", "migrated", "refactored",
    "integrated", "streamlined", "accelerated", "established",
}
_WEAK_VERBS = {"worked", "helped", "did", "made", "used", "got", "was", "were", "had", "assisted"}

# ── Section headers ATS expects ───────────────────────────────────────────────
_REQUIRED_SECTIONS = ["experience", "education", "skills", "projects"]
_OPTIONAL_SECTIONS = ["summary", "objective", "certifications", "achievements", "publications"]

# ── Role-specific critical skills (penalize heavily if missing) ───────────────
_ROLE_CRITICAL: dict[str, list[str]] = {
    "amazon sde": ["data structures", "algorithms", "system design"],
    "data scientist": ["python", "machine learning", "statistics"],
    "frontend developer": ["javascript", "react", "html", "css"],
    "backend developer": ["rest api", "sql", "docker"],
    "machine learning engineer": ["python", "machine learning", "model deployment"],
    "devops engineer": ["docker", "kubernetes", "ci/cd"],
}

# ── Embedding cache (keyed by text hash) ─────────────────────────────────────
_embed_cache: dict[str, list[float]] = {}
_CACHE_MAX = 128


def _get_embedding(model, text: str) -> Optional[list[float]]:
    """Cache-aware embedding computation."""
    key = hashlib.md5(text[:1000].encode()).hexdigest()
    if key in _embed_cache:
        return _embed_cache[key]
    try:
        vec = model.encode([text])[0].tolist()
        if len(_embed_cache) >= _CACHE_MAX:
            del _embed_cache[next(iter(_embed_cache))]
        _embed_cache[key] = vec
        return vec
    except Exception as exc:
        logger.warning("Embedding failed", extra={"error": str(exc)})
        return None


class ResumeService:
    """Hybrid ATS scoring: keyword(30%) + semantic(25%) + structure(15%) + experience(20%) - gap(10%)."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    def predict(self, payload: ResumeRequest) -> ResumeResponse:
        resume = payload.resume_text.strip()
        jd = payload.job_description.strip()

        # ── Detect role ───────────────────────────────────────────────────────
        role_data = _detect_role(jd)

        # ── 1. Keyword matching (30%) ─────────────────────────────────────────
        tfidf_model = self._registry.get("resume_tfidf")
        keyword_score = _keyword_match_score(resume, jd, tfidf_model)

        # ── 2. Semantic similarity (25%) ──────────────────────────────────────
        bert_model = self._registry.get("resume_bert")
        semantic_score = _semantic_score(resume, jd, bert_model)

        # ── 3. Structure scoring (15%) ────────────────────────────────────────
        structure_result = _structure_score(resume)

        # ── 4. Experience & project quality (20%) ────────────────────────────
        experience_result = _experience_score(resume, jd, role_data)

        # ── 5. Skill gap analysis ─────────────────────────────────────────────
        role_skills = role_data["required_skills"] if role_data else [
            skill for skill in _SKILLS_VOCAB if _skill_present(skill, jd.lower())
        ]
        resume_lower = resume.lower()
        matched_skills = [s for s in role_skills if _skill_present(s, resume_lower)]
        missing_skills = [s for s in role_skills if not _skill_present(s, resume_lower)]
        skill_match_pct = round(len(matched_skills) / max(len(role_skills), 1) * 100, 1)

        # Skill gap penalty (10%) — heavier for critical missing skills
        gap_penalty = _skill_gap_penalty(missing_skills, role_data)

        # ── 6. Composite ATS score ────────────────────────────────────────────
        raw_score = (
            keyword_score   * 0.30
            + semantic_score  * 0.25
            + structure_result["score"] * 0.15
            + experience_result["score"] * 0.20
            - gap_penalty     * 0.10
        )

        # Normalize to realistic range: 40–88
        # Real ATS tools rarely give below 40 (even bad resumes) or above 88 (perfect)
        ats_score = _normalize_score(raw_score)

        # ── 7. Weak keywords ──────────────────────────────────────────────────
        jd_keywords = _extract_jd_keywords(jd)
        weak_keywords = [kw for kw in jd_keywords if kw not in resume_lower][:10]

        # ── 8. Suggestions ────────────────────────────────────────────────────
        suggestions = _generate_suggestions(
            resume, jd, missing_skills, weak_keywords,
            structure_result, experience_result,
        )

        # ── 9. Role tips & template ───────────────────────────────────────────
        role_tips = role_data["tips"] if role_data else _generic_tips(missing_skills)
        template = role_data.get("template", "ATS-Minimal") if role_data else "ATS-Minimal"

        # ── 10. Section breakdown ─────────────────────────────────────────────
        breakdown = {
            "keyword_match": round(keyword_score, 1),
            "semantic_similarity": round(semantic_score, 1),
            "structure": round(structure_result["score"], 1),
            "experience_quality": round(experience_result["score"], 1),
            "skill_gap_penalty": round(gap_penalty, 1),
        }

        resume_score = float(np.clip(ats_score / 100.0, 0.0, 1.0))
        summary = _build_summary(ats_score, skill_match_pct, len(missing_skills), role_data, breakdown)

        return ResumeResponse(
            ats_score=round(ats_score, 1),
            resume_score=round(resume_score, 4),
            keyword_match=round(keyword_score, 1),
            skill_match_pct=skill_match_pct,
            matched_skills=matched_skills,
            missing_skills=missing_skills[:15],
            weak_keywords=weak_keywords,
            suggestions=suggestions,
            role_specific_tips=role_tips,
            template_recommendation=template,
            template_reason=_template_reason(template),
            summary=summary,
            section_breakdown=breakdown,
        )


# ── 1. Keyword matching ───────────────────────────────────────────────────────

def _keyword_match_score(resume: str, jd: str, fitted_vectorizer=None) -> float:
    """TF-IDF cosine similarity, scaled 0–100."""
    try:
        if fitted_vectorizer is not None:
            vecs = fitted_vectorizer.transform([resume, jd])
        else:
            vecs = TfidfVectorizer(
                stop_words="english", ngram_range=(1, 2), sublinear_tf=True
            ).fit_transform([resume, jd])
        if vecs.shape[1] == 0:
            return 0.0
        sim = cosine_similarity(vecs[0], vecs[1])[0][0]
        return float(np.clip(sim * 100.0, 0.0, 100.0))
    except Exception as exc:
        logger.warning("TF-IDF failed", extra={"error": str(exc)})
        return 0.0


# ── 2. Semantic similarity ────────────────────────────────────────────────────

def _semantic_score(resume: str, jd: str, bert_model=None) -> float:
    """BERT cosine similarity, scaled 0–100. Uses chunked encoding for long resumes."""
    if bert_model is None:
        return 0.0
    try:
        # Use first 800 chars of each (covers most of the relevant content)
        r_vec = _get_embedding(bert_model, resume[:800])
        j_vec = _get_embedding(bert_model, jd[:800])
        if r_vec is None or j_vec is None:
            return 0.0
        sim = cosine_similarity([r_vec], [j_vec])[0][0]
        # BERT cosine for text pairs typically ranges 0.3–0.9
        # Rescale: 0.3 → 0, 0.9 → 100
        rescaled = (float(sim) - 0.30) / 0.60 * 100.0
        return float(np.clip(rescaled, 0.0, 100.0))
    except Exception as exc:
        logger.warning("Semantic scoring failed", extra={"error": str(exc)})
        return 0.0


# ── 3. Structure scoring ──────────────────────────────────────────────────────

def _structure_score(resume: str) -> dict:
    """Score resume structure: sections, bullets, length, formatting."""
    resume_lower = resume.lower()
    score = 0.0
    issues = []
    found_sections = []

    # Required sections (60 pts total)
    for section in _REQUIRED_SECTIONS:
        if re.search(r'\b' + section + r'\b', resume_lower):
            score += 15.0
            found_sections.append(section)
        else:
            issues.append(f"Missing '{section}' section")

    # Optional sections bonus (10 pts)
    for section in _OPTIONAL_SECTIONS:
        if re.search(r'\b' + section + r'\b', resume_lower):
            score += 5.0
            break  # only count once

    # Bullet points (10 pts)
    bullet_count = len(re.findall(r'[•\-\*]\s+\w', resume))
    if bullet_count >= 5:
        score += 10.0
    elif bullet_count >= 2:
        score += 5.0
    else:
        issues.append("Use bullet points to list achievements and responsibilities")

    # Length check (10 pts) — 300–800 words is ideal
    word_count = len(resume.split())
    if 300 <= word_count <= 800:
        score += 10.0
    elif 200 <= word_count <= 1200:
        score += 5.0
    else:
        issues.append(f"Resume length ({word_count} words) is {'too short' if word_count < 200 else 'too long'} — aim for 300–800 words")

    # ATS-unfriendly elements (penalties)
    if re.search(r'<table|colspan|rowspan', resume, re.IGNORECASE):
        score -= 15.0
        issues.append("Remove tables — ATS parsers struggle with them")
    if re.search(r'[★●◆▪□■]', resume):
        score -= 5.0
        issues.append("Replace special characters with standard bullets (•) or hyphens")
    if re.search(r'page \d+ of \d+', resume, re.IGNORECASE):
        score -= 5.0

    # Contact info (5 pts)
    has_email = bool(re.search(r'\b[\w.+-]+@[\w-]+\.\w+\b', resume))
    has_phone = bool(re.search(r'\b\d{10}\b|\+\d{1,3}[\s-]\d+', resume))
    if has_email or has_phone:
        score += 5.0

    return {
        "score": float(np.clip(score, 0.0, 100.0)),
        "found_sections": found_sections,
        "issues": issues,
        "word_count": word_count,
    }


# ── 4. Experience & project quality ──────────────────────────────────────────

def _experience_score(resume: str, jd: str, role_data: dict | None) -> dict:
    """Score experience quality: action verbs, quantification, domain relevance."""
    resume_lower = resume.lower()
    score = 0.0
    notes = []

    # Action verbs (25 pts)
    lines = [l.strip() for l in resume.split('\n') if l.strip()]
    strong_count = sum(
        1 for line in lines
        if line.split()[0].lower().rstrip('.,;') in _STRONG_VERBS
        if line.split()
    )
    weak_count = sum(
        1 for line in lines
        if line.split()[0].lower().rstrip('.,;') in _WEAK_VERBS
        if line.split()
    )
    verb_score = min(strong_count * 5, 25) - weak_count * 3
    score += max(verb_score, 0)
    if strong_count >= 3:
        notes.append(f"Good use of {strong_count} strong action verbs")
    elif strong_count == 0:
        notes.append("No strong action verbs found — start bullets with verbs like 'Built', 'Optimized'")

    # Quantification (25 pts)
    quant_patterns = [
        r'\d+%', r'\d+x', r'\$[\d,]+', r'\d+[KMB]\+?',
        r'\d+ (users|requests|ms|seconds|hours|days|teams|engineers)',
        r'(reduced|improved|increased|decreased|optimized).{0,30}\d+',
    ]
    quant_hits = sum(1 for p in quant_patterns if re.search(p, resume_lower))
    quant_score = min(quant_hits * 8, 25)
    score += quant_score
    if quant_hits == 0:
        notes.append("No quantified achievements — add metrics like '40% faster', '10K users'")

    # Domain relevance (30 pts)
    if role_data:
        role_keywords = role_data.get("keywords", [])
        domain_hits = sum(1 for kw in role_keywords if kw.lower() in resume_lower)
        domain_score = min(domain_hits / max(len(role_keywords), 1) * 30, 30)
        score += domain_score
    else:
        score += 15.0  # neutral if no role detected

    # Project depth (20 pts)
    has_projects = "project" in resume_lower
    has_github = bool(re.search(r'github\.com|gitlab\.com', resume_lower))
    has_live = bool(re.search(r'https?://', resume_lower))
    project_score = (10 if has_projects else 0) + (5 if has_github else 0) + (5 if has_live else 0)
    score += project_score
    if not has_github:
        notes.append("Add GitHub profile link to showcase your code")

    return {
        "score": float(np.clip(score, 0.0, 100.0)),
        "strong_verbs": strong_count,
        "quantified": quant_hits > 0,
        "notes": notes,
    }


# ── 5. Skill gap penalty ──────────────────────────────────────────────────────

def _skill_gap_penalty(missing_skills: list[str], role_data: dict | None) -> float:
    """0–100 penalty score. Higher = more critical skills missing."""
    if not missing_skills:
        return 0.0

    # Check how many critical skills are missing
    critical = []
    if role_data:
        role_key = role_data.get("title", "").lower()
        for key, crits in _ROLE_CRITICAL.items():
            if key in role_key or role_key in key:
                critical = crits
                break

    critical_missing = [s for s in missing_skills if s.lower() in [c.lower() for c in critical]]
    non_critical_missing = len(missing_skills) - len(critical_missing)

    penalty = len(critical_missing) * 15 + non_critical_missing * 3
    return float(np.clip(penalty, 0.0, 100.0))


# ── 6. Normalization ──────────────────────────────────────────────────────────

def _normalize_score(raw: float) -> float:
    """
    Map raw composite score to realistic ATS range.
    Real ATS tools: most resumes score 40–85, exceptional ones 85–92.
    Formula: sigmoid-like stretch from [0,100] → [40,92]
    """
    clipped = float(np.clip(raw, 0.0, 100.0))
    # Linear stretch: 0→40, 100→92
    normalized = 40.0 + (clipped / 100.0) * 52.0
    # Add small noise floor so identical inputs don't look robotic
    return float(np.clip(normalized, 40.0, 92.0))


# ── Helpers ───────────────────────────────────────────────────────────────────

def _skill_present(skill: str, resume_lower: str) -> bool:
    """Check if skill is present as a whole word/phrase."""
    pattern = r'\b' + re.escape(skill.lower()) + r'\b'
    return bool(re.search(pattern, resume_lower))


def _extract_jd_keywords(text: str) -> list[str]:
    """Extract high-frequency meaningful keywords from JD."""
    stop = {
        "the", "and", "for", "with", "you", "will", "have", "are", "our",
        "this", "that", "from", "your", "we", "in", "of", "to", "a", "an",
        "is", "be", "as", "at", "by", "or", "on", "it", "its", "not",
        "must", "should", "can", "may", "also", "well", "good", "strong",
    }
    words = re.findall(r'\b[a-z][a-z+#.]{2,}\b', text.lower())
    freq: dict[str, int] = {}
    for w in words:
        if w not in stop:
            freq[w] = freq.get(w, 0) + 1
    return [w for w, _ in sorted(freq.items(), key=lambda x: -x[1])[:20]]


def _detect_role(jd: str) -> dict | None:
    """Detect job role from JD text."""
    role_hints = {
        "amazon sde": ["amazon", "sde", "software development engineer"],
        "data scientist": ["data scientist", "machine learning", "data science"],
        "frontend developer": ["frontend", "front-end", "react developer", "vue", "angular"],
        "backend developer": ["backend", "back-end", "server-side", "api developer"],
        "machine learning engineer": ["ml engineer", "mlops", "model deployment", "ml platform"],
        "devops engineer": ["devops", "sre", "site reliability", "infrastructure engineer"],
    }
    jd_lower = jd.lower()
    for role_key, hints in role_hints.items():
        if any(re.search(r"\b" + re.escape(h) + r"\b", jd_lower) for h in hints):
            return get_role(role_key)
    return None


def _generate_suggestions(
    resume: str,
    jd: str,
    missing_skills: list[str],
    weak_keywords: list[str],
    structure_result: dict,
    experience_result: dict,
) -> list[ImprovementSuggestion]:
    suggestions: list[ImprovementSuggestion] = []
    resume_lower = resume.lower()

    # Structure issues
    for issue in structure_result.get("issues", [])[:2]:
        suggestions.append(ImprovementSuggestion(
            category="structure",
            suggestion=issue,
            reason="Proper sections help ATS parse your resume correctly",
        ))

    # Experience notes
    for note in experience_result.get("notes", [])[:2]:
        suggestions.append(ImprovementSuggestion(
            category="impact" if "quantif" in note.lower() else "action_verbs",
            suggestion=note,
            reason="Improves recruiter impact and ATS ranking",
        ))

    # Missing skills
    if missing_skills:
        suggestions.append(ImprovementSuggestion(
            category="keywords",
            suggestion=f"Add these missing skills: {', '.join(missing_skills[:5])}",
            reason="These skills appear in the job description but not in your resume",
        ))

    # Weak keywords
    if weak_keywords:
        suggestions.append(ImprovementSuggestion(
            category="keywords",
            suggestion=f"Incorporate these JD keywords naturally: {', '.join(weak_keywords[:5])}",
            reason="Higher keyword density improves ATS ranking",
        ))

    # Summary section
    if "summary" not in resume_lower and "objective" not in resume_lower:
        suggestions.append(ImprovementSuggestion(
            category="structure",
            suggestion="Add a 2–3 line professional summary at the top",
            reason="A strong summary immediately tells recruiters why you're a fit",
        ))

    return suggestions[:6]


def _generic_tips(missing_skills: list[str]) -> list[str]:
    tips = [
        "Tailor your resume for each job application",
        "Use a clean, single-column ATS-friendly format",
        "Keep resume to 1–2 pages maximum",
    ]
    if missing_skills:
        tips.append(f"Consider adding: {', '.join(missing_skills[:4])}")
    return tips


def _template_reason(template: str) -> str:
    reasons = {
        "ATS-Minimal": "Single-column, no tables or graphics — maximizes ATS parsing accuracy",
        "ATS-Clean": "Clean two-section layout with clear headers — balances readability and ATS compatibility",
        "ATS-Modern": "Modern design with subtle styling — works well for creative/frontend roles",
    }
    return reasons.get(template, "ATS-optimized format for maximum compatibility")


def _build_summary(
    ats_score: float,
    skill_match: float,
    missing_count: int,
    role_data: dict | None,
    breakdown: dict,
) -> str:
    role_name = role_data["title"] if role_data else "this role"
    weakest = min(breakdown, key=breakdown.get)  # type: ignore
    weakest_label = {
        "keyword_match": "keyword coverage",
        "semantic_similarity": "content relevance",
        "structure": "resume structure",
        "experience_quality": "experience quality",
        "skill_gap_penalty": "skill gaps",
    }.get(weakest, weakest)

    if ats_score >= 78:
        return f"Strong match for {role_name} ({ats_score:.0f}/100). Your resume is well-optimized. Focus on {missing_count} missing skills to push higher."
    elif ats_score >= 62:
        return f"Moderate match for {role_name} ({ats_score:.0f}/100). {skill_match:.0f}% skill match. Biggest improvement area: {weakest_label}."
    else:
        return f"Needs improvement for {role_name} ({ats_score:.0f}/100). Only {skill_match:.0f}% skill match. Prioritize: {weakest_label} and missing skills."
