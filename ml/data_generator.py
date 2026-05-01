"""Generates synthetic training datasets for all 6 ML modules."""
from __future__ import annotations

import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)
DATASETS_DIR = Path(__file__).parent.parent / "datasets"
DATASETS_DIR.mkdir(exist_ok=True)


def generate_burnout_data(n: int = 3000) -> pd.DataFrame:
    """Enhanced features including workload_ratio, rest_efficiency, overwork_days."""
    mean_h = RNG.uniform(1.0, 13.0, n)
    std_h = RNG.uniform(0.0, 4.5, n)
    max_h = np.clip(mean_h + RNG.uniform(0.0, 3.0, n), 0.0, 16.0)
    min_h = np.clip(mean_h - RNG.uniform(0.0, 3.0, n), 0.0, None)
    cv = np.where(mean_h > 0, std_h / mean_h, 0.0)
    consistency = np.clip(1.0 - cv, 0.0, 1.0)

    # Additional features
    sleep_h = np.clip(RNG.uniform(4.0, 9.0, n), 4.0, 9.0)
    workload_ratio = np.clip(mean_h / np.maximum(sleep_h, 0.1), 0.0, 4.0)
    rest_efficiency = np.clip((sleep_h - 4.0) / 5.0, 0.0, 1.0)
    overwork_days = RNG.integers(0, 8, n).astype(float)

    # Richer label: combines hours, sleep, consistency
    burnout_score = (
        mean_h / 13.0 * 0.4
        + (1.0 - rest_efficiency) * 0.3
        + (1.0 - consistency) * 0.2
        + overwork_days / 7.0 * 0.1
    )
    label = np.where(burnout_score > 0.65, 2, np.where(burnout_score > 0.38, 1, 0)).astype(int)
    flip_mask = RNG.random(n) < 0.06
    label[flip_mask] = RNG.integers(0, 3, flip_mask.sum())

    return pd.DataFrame({
        "mean_hours": mean_h,
        "std_hours": std_h,
        "max_hours": max_h,
        "min_hours": min_h,
        "consistency_score": consistency,
        "sleep_hours": sleep_h,
        "workload_ratio": workload_ratio,
        "rest_efficiency": rest_efficiency,
        "overwork_days": overwork_days,
        "burnout_label": label,
    })


def generate_internship_data(n: int = 2000) -> pd.DataFrame:
    """Features: duration_months, company_tier, role_relevance, project_count → internship_score (0-10)."""
    duration = RNG.integers(1, 13, n).astype(float)
    tier = RNG.integers(1, 5, n).astype(float)       # 1=top, 4=low
    relevance = RNG.uniform(0.0, 1.0, n)
    projects = RNG.integers(0, 6, n).astype(float)

    score = (
        duration * 0.5
        + (4 - tier) * 1.5
        + relevance * 2.0
        + projects * 0.5
        + RNG.normal(0, 0.3, n)
    )
    score = np.clip(score, 0.0, 10.0)

    return pd.DataFrame({
        "duration_months": duration,
        "company_tier": tier,
        "role_relevance": relevance,
        "project_count": projects,
        "internship_score": score,
    })


def generate_failure_data(n: int = 2000) -> pd.DataFrame:
    """Features: avg_score, min_score, max_score, backlogs, project_failures, num_below_50 → failure_class (0-3)."""
    avg_score = RNG.uniform(20.0, 95.0, n)
    spread = RNG.uniform(0.0, 20.0, n)
    min_score = np.clip(avg_score - spread, 0.0, 100.0)
    max_score = np.clip(avg_score + spread, 0.0, 100.0)
    backlogs = RNG.integers(0, 5, n).astype(float)
    proj_fail = RNG.integers(0, 4, n).astype(float)
    num_below_50 = np.clip(((50 - min_score) / 10).astype(int), 0, 5).astype(float)

    # 0=no issue, 1=poor overall, 2=inconsistent, 3=critical
    label = np.zeros(n, dtype=int)
    label[avg_score < 40] = 1
    label[(avg_score >= 40) & (spread > 15)] = 2
    label[(avg_score < 40) & (min_score < 35)] = 3

    return pd.DataFrame({
        "avg_score": avg_score,
        "min_score": min_score,
        "max_score": max_score,
        "backlogs": backlogs,
        "project_failures": proj_fail,
        "num_below_50": num_below_50,
        "failure_class": label,
    })


def generate_placement_data(n: int = 3000) -> pd.DataFrame:
    """Features: consistency_score, resume_score, internship_score, placement_boost,
    burnout_risk_encoded, avg_subject_score → placed (0/1)."""
    consistency = RNG.uniform(0.0, 1.0, n)
    resume = RNG.uniform(0.0, 1.0, n)
    internship = RNG.uniform(0.0, 10.0, n)
    boost = internship / 10.0
    burnout_enc = RNG.integers(0, 3, n).astype(float)   # 0=Low,1=Med,2=High
    avg_subj = RNG.uniform(30.0, 95.0, n)

    prob = (
        consistency * 0.20
        + resume * 0.25
        + (internship / 10.0) * 0.20
        + boost * 0.15
        + (avg_subj / 100.0) * 0.20
        - burnout_enc * 0.05
        + RNG.normal(0, 0.05, n)
    )
    prob = np.clip(prob, 0.0, 1.0)
    placed = (RNG.random(n) < prob).astype(int)

    return pd.DataFrame({
        "consistency_score": consistency,
        "resume_score": resume,
        "internship_score": internship,
        "placement_boost": boost,
        "burnout_risk_encoded": burnout_enc,
        "avg_subject_score": avg_subj,
        "placed": placed,
    })


def generate_roadmap_data(n: int = 1000) -> pd.DataFrame:
    """Skill index → priority_score for collaborative filtering proxy."""
    skill_idx = np.arange(n) % 50
    priority = RNG.uniform(0.0, 1.0, n) + (skill_idx % 5) * 0.1
    priority = np.clip(priority, 0.0, 1.0)
    return pd.DataFrame({"skill_idx": skill_idx.astype(float), "priority_score": priority})


def generate_tfidf_corpus(n: int = 500) -> pd.DataFrame:
    """Synthetic resume + JD pairs for TF-IDF vectorizer fitting."""
    skills_pool = [
        "python", "java", "javascript", "sql", "machine learning", "deep learning",
        "docker", "kubernetes", "react", "fastapi", "aws", "data structures",
        "algorithms", "system design", "postgresql", "pandas", "numpy", "scikit-learn",
    ]
    rows = []
    for _ in range(n):
        k = RNG.integers(3, 10)
        chosen = RNG.choice(skills_pool, size=int(k), replace=False).tolist()
        resume = " ".join(chosen + ["experience", "project", "internship"])
        jd_k = RNG.integers(3, 8)
        jd_skills = RNG.choice(skills_pool, size=int(jd_k), replace=False).tolist()
        jd = " ".join(jd_skills + ["required", "preferred", "role"])
        rows.append({"resume": resume, "jd": jd})
    return pd.DataFrame(rows)


def save_all() -> None:
    datasets = {
        "burnout.csv": generate_burnout_data(),
        "internship.csv": generate_internship_data(),
        "failure.csv": generate_failure_data(),
        "placement.csv": generate_placement_data(),
        "roadmap.csv": generate_roadmap_data(),
        "tfidf_corpus.csv": generate_tfidf_corpus(),
    }
    for name, df in datasets.items():
        path = DATASETS_DIR / name
        df.to_csv(path, index=False)
        print(f"  Saved {name}: {len(df)} rows → {path}")


if __name__ == "__main__":
    save_all()
