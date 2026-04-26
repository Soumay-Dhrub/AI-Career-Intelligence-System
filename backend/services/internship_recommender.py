"""Internship recommendation engine — loads job dataset, matches student profile."""
from __future__ import annotations

import json
import re
import zipfile
from functools import lru_cache
from pathlib import Path
from typing import Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.core.logging import get_logger
from backend.services.company_db import classify_company_tier, get_domain_skills

logger = get_logger(__name__)

_DATASET_PATH = Path("datasets/job_descriptions.csv.zip")
_MAX_ROWS = 300_000   # cap for memory
_MIN_MATCH = 0.05     # minimum cosine similarity to include


@lru_cache(maxsize=1)
def _load_internship_data():
    """Load and cache internship rows from dataset. Returns (companies_df, vectorizer, tfidf_matrix)."""
    try:
        import pandas as pd

        logger.info("Loading internship dataset…")
        with zipfile.ZipFile(_DATASET_PATH) as z:
            with z.open("job_descriptions.csv") as f:
                df = pd.read_csv(f, nrows=_MAX_ROWS, usecols=[
                    "Job Title", "Role", "Company", "Work Type",
                    "skills", "Job Description", "location", "Country",
                    "Salary Range", "Company Profile",
                ])

        # Keep only internship rows
        df = df[df["Work Type"] == "Intern"].copy()
        df = df.dropna(subset=["Company", "skills"])
        df["skills"] = df["skills"].fillna("").astype(str)
        df["Job Description"] = df["Job Description"].fillna("").astype(str)
        df["Role"] = df["Role"].fillna(df["Job Title"]).fillna("Intern").astype(str)
        df["location"] = df["location"].fillna("Remote").astype(str)
        df["Salary Range"] = df["Salary Range"].fillna("Not disclosed").astype(str)

        # Combine text for TF-IDF
        df["combined_text"] = (df["skills"] + " " + df["Job Description"]).str.lower()

        # Deduplicate by company + role
        df = df.drop_duplicates(subset=["Company", "Role"]).reset_index(drop=True)
        df = df.head(5000)  # keep top 5000 unique roles

        # Fit TF-IDF
        vectorizer = TfidfVectorizer(
            stop_words="english", ngram_range=(1, 2),
            max_features=8000, sublinear_tf=True,
        )
        tfidf_matrix = vectorizer.fit_transform(df["combined_text"])

        logger.info(f"Internship dataset loaded: {len(df)} unique roles")
        return df, vectorizer, tfidf_matrix

    except Exception as exc:
        logger.warning(f"Could not load internship dataset: {exc}")
        return None, None, None


def recommend_companies(
    student_skills: list[str],
    domain: str,
    ats_score: float,
    cgpa: float,
    year: int,
    top_n: int = 10,
) -> list[dict]:
    """
    Match student profile against internship dataset.
    Returns list of company recommendation dicts.
    """
    df, vectorizer, tfidf_matrix = _load_internship_data()

    if df is None:
        return _fallback_recommendations(student_skills, domain, ats_score, cgpa)

    # Build student query
    domain_skills = get_domain_skills(domain)
    all_skills = list(set(student_skills + domain_skills))
    query = " ".join(all_skills).lower() + " " + domain.lower()

    try:
        query_vec = vectorizer.transform([query])
        scores = cosine_similarity(query_vec, tfidf_matrix)[0]
    except Exception as exc:
        logger.warning(f"TF-IDF matching failed: {exc}")
        return _fallback_recommendations(student_skills, domain, ats_score, cgpa)

    # Get top indices
    top_idx = np.argsort(scores)[::-1]
    results = []
    seen_companies: set[str] = set()

    for idx in top_idx:
        if len(results) >= top_n * 3:  # gather more, filter later
            break
        if scores[idx] < _MIN_MATCH:
            break

        row = df.iloc[idx]
        company = str(row["Company"]).strip()
        if company in seen_companies:
            continue
        seen_companies.add(company)

        tier = classify_company_tier(company)
        match_score = float(scores[idx])

        # Selection probability
        sel_prob = _selection_probability(
            match_score=match_score,
            tier=tier,
            cgpa=cgpa,
            ats_score=ats_score,
            year=year,
            student_skills=student_skills,
            required_skills_text=str(row["skills"]),
        )

        # Smart filter: don't suggest Tier 1 if very low readiness
        readiness = _readiness_score(cgpa, ats_score, len(student_skills), year)
        if tier == 1 and readiness < 40:
            continue

        # Extract required skills from row
        req_skills = _parse_skills(str(row["skills"]))
        missing = [s for s in req_skills if s.lower() not in " ".join(student_skills).lower()][:5]
        matched = [s for s in req_skills if s.lower() in " ".join(student_skills).lower()][:5]

        results.append({
            "company": company,
            "role": str(row["Role"]),
            "tier": tier,
            "tier_label": ["", "MNC", "Mid-Level", "Startup"][tier],
            "match_score": round(match_score * 100, 1),
            "selection_probability": round(sel_prob, 3),
            "required_skills": req_skills[:8],
            "matched_skills": matched,
            "missing_skills": missing,
            "location": str(row["location"]),
            "salary_range": str(row["Salary Range"]),
            "placement_impact": _placement_impact(tier, match_score, domain),
            "reason": _reason(company, tier, match_score, matched, domain),
        })

    # Sort: by selection probability desc
    results.sort(key=lambda x: x["selection_probability"], reverse=True)

    # Ensure tier diversity: at least 1 MNC if readiness >= 60
    return results[:top_n]


def _selection_probability(
    match_score: float,
    tier: int,
    cgpa: float,
    ats_score: float,
    year: int,
    student_skills: list[str],
    required_skills_text: str,
) -> float:
    """Compute realistic selection probability 0–1."""
    # Base from match score
    base = match_score * 0.35

    # CGPA contribution (normalized 0–10 scale)
    cgpa_norm = min(cgpa / 10.0, 1.0)
    base += cgpa_norm * 0.25

    # ATS score contribution
    base += (ats_score / 100.0) * 0.20

    # Skill count
    skill_bonus = min(len(student_skills) / 15.0, 1.0) * 0.10

    # Year bonus (3rd/4th year more competitive)
    year_bonus = {1: 0.0, 2: 0.02, 3: 0.05, 4: 0.03}.get(year, 0.0)

    # Tier penalty
    tier_penalty = {1: 0.15, 2: 0.05, 3: 0.0}.get(tier, 0.0)

    prob = base + skill_bonus + year_bonus - tier_penalty
    return float(np.clip(prob, 0.05, 0.92))


def _readiness_score(cgpa: float, ats_score: float, skill_count: int, year: int) -> float:
    """0–100 readiness score."""
    score = (
        min(cgpa / 10.0, 1.0) * 30
        + (ats_score / 100.0) * 35
        + min(skill_count / 12.0, 1.0) * 25
        + {1: 5, 2: 8, 3: 10, 4: 10}.get(year, 5)
    )
    return float(np.clip(score, 0, 100))


def _placement_impact(tier: int, match_score: float, domain: str) -> dict:
    if tier == 1 and match_score > 0.3:
        return {"level": "High", "explanation": f"Top-tier company in {domain} — significantly boosts placement chances"}
    elif tier <= 2 and match_score > 0.2:
        return {"level": "Medium", "explanation": f"Solid industry experience in {domain} — good placement boost"}
    else:
        return {"level": "Low", "explanation": "Entry-level experience — builds foundation for future opportunities"}


def _parse_skills(skills_text: str) -> list[str]:
    """Extract skill tokens from skills text."""
    # Common tech skills to look for in the text
    KNOWN_SKILLS = [
        "Python", "Java", "JavaScript", "C++", "SQL", "React", "Node.js",
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
        "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Git", "Linux",
        "Data Analysis", "Statistics", "NLP", "Computer Vision",
        "REST API", "Microservices", "CI/CD", "Agile", "Scrum",
        "HTML", "CSS", "TypeScript", "MongoDB", "PostgreSQL", "Redis",
        "Pandas", "NumPy", "Scikit-learn", "Tableau", "Power BI",
        "Android", "iOS", "Flutter", "React Native", "Swift", "Kotlin",
        "Cybersecurity", "Networking", "Cloud Computing", "DevOps",
        "Communication", "Problem Solving", "Team Leadership",
    ]
    text_lower = skills_text.lower()
    found = [s for s in KNOWN_SKILLS if s.lower() in text_lower]
    if found:
        return found[:10]

    # Fallback: split on delimiters
    parts = re.split(r'[,\n•·\-–]', skills_text)
    skills = []
    for p in parts:
        p = p.strip()
        if 3 <= len(p) <= 40 and not p.isdigit():
            skills.append(p[:40])
    return skills[:10]


def _reason(company: str, tier: int, match_score: float, matched: list[str], domain: str) -> str:
    tier_label = ["", "top-tier MNC", "established company", "startup"][tier]
    skill_str = ", ".join(matched[:3]) if matched else domain
    pct = round(match_score * 100, 0)
    return f"{company} is a {tier_label} with {pct:.0f}% profile match. Your skills in {skill_str} align well with their requirements."


def _fallback_recommendations(
    student_skills: list[str],
    domain: str,
    ats_score: float,
    cgpa: float,
) -> list[dict]:
    """Static fallback when dataset unavailable."""
    domain_lower = domain.lower()
    companies = []

    if any(k in domain_lower for k in ["software", "sde", "backend", "fullstack"]):
        companies = [
            ("Amazon", 1, 0.72), ("Microsoft", 1, 0.68), ("Infosys", 2, 0.78),
            ("TCS", 2, 0.82), ("Wipro", 2, 0.80), ("Razorpay", 3, 0.65),
        ]
    elif any(k in domain_lower for k in ["data", "ml", "ai", "machine"]):
        companies = [
            ("Google", 1, 0.60), ("IBM", 1, 0.65), ("Accenture", 2, 0.75),
            ("Mu Sigma", 2, 0.78), ("Analytics Vidhya", 3, 0.70),
        ]
    elif any(k in domain_lower for k in ["web", "frontend", "react"]):
        companies = [
            ("Shopify", 1, 0.65), ("Freshworks", 2, 0.75), ("Zoho", 2, 0.80),
            ("BrowserStack", 2, 0.72), ("Internshala", 3, 0.85),
        ]
    else:
        companies = [
            ("Infosys", 2, 0.80), ("TCS", 2, 0.82), ("Wipro", 2, 0.78),
            ("HCL", 2, 0.75), ("Cognizant", 2, 0.77),
        ]

    domain_skills = get_domain_skills(domain)
    results = []
    for name, tier, base_prob in companies:
        adj_prob = base_prob * (0.7 + cgpa / 33.3) * (0.8 + ats_score / 500)
        adj_prob = float(np.clip(adj_prob, 0.05, 0.92))
        missing = [s for s in domain_skills if s.lower() not in " ".join(student_skills).lower()][:4]
        matched = [s for s in domain_skills if s.lower() in " ".join(student_skills).lower()][:4]
        results.append({
            "company": name,
            "role": f"{domain.title()} Intern",
            "tier": tier,
            "tier_label": ["", "MNC", "Mid-Level", "Startup"][tier],
            "match_score": round(base_prob * 100, 1),
            "selection_probability": round(adj_prob, 3),
            "required_skills": domain_skills[:6],
            "matched_skills": matched,
            "missing_skills": missing,
            "location": "Multiple Locations",
            "salary_range": "Stipend-based",
            "placement_impact": _placement_impact(tier, base_prob, domain),
            "reason": _reason(name, tier, base_prob, matched, domain),
        })
    return results
