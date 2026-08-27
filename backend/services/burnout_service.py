"""BurnoutService — enhanced with advanced features, NLP, smart scheduler, caching."""
from __future__ import annotations

import hashlib
import json
import re
from functools import lru_cache
from typing import Optional

import numpy as np

from backend.core.logging import get_logger
from backend.schemas.burnout import (
    BurnoutRequest, BurnoutResponse, DailySchedule, TimeBlock, EmotionTag
)
from backend.services.model_registry import ModelRegistry

logger = get_logger(__name__)

# ── NLP keyword banks ─────────────────────────────────────────────────────────
_STRESS_KEYWORDS = {
    "exhausted", "tired", "overwhelmed", "stressed", "anxious", "burnout",
    "burnt", "drained", "hopeless", "frustrated", "panic", "depressed",
    "unmotivated", "struggling", "pressure", "deadline", "overloaded",
}
_POSITIVE_KEYWORDS = {
    "motivated", "focused", "energetic", "productive", "confident", "great",
    "good", "happy", "refreshed", "calm", "balanced", "rested", "excited",
}
_NEUTRAL_KEYWORDS = {
    "okay", "fine", "normal", "average", "moderate", "manageable", "alright",
}


def _analyse_mood(text: str) -> dict:
    """Lightweight NLP: sentiment + emotion tags without external models."""
    if not text or not text.strip():
        return {"sentiment": "neutral", "score": 0.0, "tags": [], "summary": "No mood description provided."}

    words = set(re.findall(r"\b\w+\b", text.lower()))
    stress_hits = words & _STRESS_KEYWORDS
    positive_hits = words & _POSITIVE_KEYWORDS
    neutral_hits = words & _NEUTRAL_KEYWORDS

    stress_score = len(stress_hits)
    positive_score = len(positive_hits)

    total = stress_score + positive_score + len(neutral_hits) + 1  # +1 avoid div/0
    sentiment_score = (positive_score - stress_score) / total

    if sentiment_score > 0.1:
        sentiment = "positive"
    elif sentiment_score < -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    # Emotion tags
    tags = []
    if stress_hits:
        tags.append({"label": "stressed", "confidence": round(min(stress_score / 3, 1.0), 2)})
    if positive_hits:
        tags.append({"label": "motivated", "confidence": round(min(positive_score / 3, 1.0), 2)})
    if "anxious" in words or "panic" in words:
        tags.append({"label": "anxious", "confidence": 0.85})
    if "burnout" in words or "burnt" in words or "exhausted" in words:
        tags.append({"label": "burnout", "confidence": 0.90})
    if not tags:
        tags.append({"label": "neutral", "confidence": 0.70})

    summary_map = {
        "positive": "You seem to be in a good headspace. Keep it up!",
        "neutral": "Your mood seems balanced. Stay consistent.",
        "negative": "You're showing signs of stress. Consider taking a break.",
    }

    return {
        "sentiment": sentiment,
        "score": round(sentiment_score, 3),
        "tags": tags,
        "summary": summary_map[sentiment],
    }


def _compute_features(hours: np.ndarray) -> dict:
    """Compute advanced engineered features from study hours array."""
    mean_h = float(np.mean(hours))
    std_h = float(np.std(hours))
    max_h = float(np.max(hours))
    min_h = float(np.min(hours))

    # Coefficient of variation → consistency
    cv = std_h / mean_h if mean_h > 0 else 1.0
    consistency_score = float(np.clip(1.0 - cv, 0.0, 1.0))

    # Trend: is workload increasing over time?
    n = len(hours)
    if n >= 3:
        first_half = float(np.mean(hours[: n // 2]))
        second_half = float(np.mean(hours[n // 2 :]))
        trend = second_half - first_half  # positive = increasing load
    else:
        trend = 0.0

    # Overwork days (>10h study)
    overwork_days = int(np.sum(hours > 10))
    # Low days (<2h study)
    low_days = int(np.sum(hours < 2))

    return {
        "mean_hours": mean_h,
        "std_hours": std_h,
        "max_hours": max_h,
        "min_hours": min_h,
        "consistency_score": consistency_score,
        "trend": trend,
        "overwork_days": overwork_days,
        "low_days": low_days,
    }


def _compute_schedule_features(schedule: Optional[DailySchedule]) -> dict:
    """Derive workload_ratio and rest_efficiency from daily schedule."""
    if schedule is None:
        return {"workload_ratio": 1.0, "rest_efficiency": 0.5,
                "overwork": False, "sleep_deprivation": False}

    sleep = max(schedule.sleep_hours, 0.1)
    study = schedule.study_hours
    breaks = schedule.break_hours

    workload_ratio = round(study / sleep, 3)
    # Rest efficiency: ideal is 7-9h sleep + regular breaks
    sleep_score = float(np.clip((sleep - 4) / 5, 0.0, 1.0))   # 4h=0, 9h=1
    break_score = float(np.clip(breaks / 2, 0.0, 1.0))         # 2h breaks = ideal
    rest_efficiency = round((sleep_score * 0.7 + break_score * 0.3), 3)

    overwork = study > 10 or workload_ratio > 2.5
    sleep_deprivation = sleep < 6

    return {
        "workload_ratio": workload_ratio,
        "rest_efficiency": rest_efficiency,
        "overwork": overwork,
        "sleep_deprivation": sleep_deprivation,
    }


def _generate_schedule(schedule: Optional[DailySchedule], burnout_risk: str) -> list[TimeBlock]:
    """Generate an adaptive time-blocked schedule."""
    if schedule is None:
        # Default balanced schedule
        study_h = 6.0
        sleep_h = 8.0
        college_h = 4.0
        break_h = 2.0
    else:
        study_h = schedule.study_hours
        sleep_h = max(schedule.sleep_hours, 7.0)  # enforce min 7h sleep
        college_h = schedule.college_hours
        break_h = max(schedule.break_hours, 1.0)

    # Adjust study hours based on burnout risk
    if burnout_risk == "High":
        study_h = min(study_h, 5.0)
        break_h = max(break_h, 2.0)
    elif burnout_risk == "Medium":
        study_h = min(study_h, 7.0)
        break_h = max(break_h, 1.5)

    blocks: list[TimeBlock] = []
    current_hour = 6  # start at 6 AM

    def add_block(hours: float, activity: str, category: str) -> None:
        nonlocal current_hour
        if hours <= 0:
            return
        start = f"{int(current_hour):02d}:{int((current_hour % 1) * 60):02d}"
        current_hour += hours
        end = f"{int(current_hour):02d}:{int((current_hour % 1) * 60):02d}"
        blocks.append(TimeBlock(start=start, end=end, activity=activity, category=category))

    # Morning routine
    add_block(0.5, "Morning routine & breakfast", "other")

    # College time
    if college_h > 0:
        add_block(college_h, "College / Classes", "college")
        add_block(0.5, "Lunch break", "break")

    # Study sessions with breaks every 90 mins
    remaining_study = study_h
    session_num = 1
    while remaining_study > 0:
        session = min(remaining_study, 1.5)  # max 90-min sessions
        add_block(session, f"Study Session {session_num}", "study")
        remaining_study -= session
        session_num += 1
        if remaining_study > 0:
            add_block(0.25, "Short break", "break")

    # Evening break
    add_block(max(break_h - 0.5, 0.5), "Relaxation / Exercise", "break")

    # Sleep
    add_block(sleep_h, "Sleep", "sleep")

    return blocks


def _generate_recommendations(
    features: dict,
    schedule_features: dict,
    burnout_risk: str,
    mood: Optional[dict],
) -> list[str]:
    recs = []
    mean_h = features["mean_hours"]
    consistency = features["consistency_score"]
    overwork_days = features["overwork_days"]

    if burnout_risk == "High":
        recs.append("🚨 Reduce daily study hours to 5–6 hours immediately.")
        recs.append("😴 Prioritize 7–8 hours of sleep every night.")
    elif burnout_risk == "Medium":
        recs.append("⚠️ You're approaching burnout. Add 30-min breaks between sessions.")

    if overwork_days > 2:
        recs.append(f"📉 You had {overwork_days} days with 10+ study hours. Spread workload evenly.")

    if consistency < 0.5:
        recs.append("📅 Your study schedule is inconsistent. Try studying at the same time daily.")

    if schedule_features.get("sleep_deprivation"):
        recs.append("💤 You're sleeping less than 6 hours. Sleep deprivation reduces learning efficiency by 40%.")

    if schedule_features.get("overwork"):
        recs.append("🏃 Take a full rest day once a week to recover and consolidate learning.")

    if features.get("trend", 0) > 2:
        recs.append("📈 Your workload is increasing rapidly. Plan ahead to avoid a crash.")

    if mood and mood.get("sentiment") == "negative":
        recs.append("🧘 Your mood indicates stress. Try 10 minutes of mindfulness or a short walk.")

    if not recs:
        recs.append("✅ Your study habits look healthy. Keep maintaining this balance!")

    return recs


def _human_insight(burnout_risk: str, consistency: float, mood: Optional[dict]) -> str:
    mood_note = ""
    if mood and mood.get("sentiment") == "negative":
        mood_note = " Your mood also suggests you're under pressure."
    elif mood and mood.get("sentiment") == "positive":
        mood_note = " Your positive mindset is a great asset."

    if burnout_risk == "High":
        return f"You're showing strong signs of burnout.{mood_note} It's time to step back, rest, and reset your schedule."
    elif burnout_risk == "Medium":
        return f"You're managing, but the cracks are showing.{mood_note} Small adjustments now will prevent bigger problems later."
    else:
        score_pct = round(consistency * 100)
        return f"You're doing well with {score_pct}% consistency.{mood_note} Keep this rhythm going!"


# ── Simple in-memory cache (keyed by request hash) ───────────────────────────
_cache: dict[str, BurnoutResponse] = {}
_CACHE_MAX = 256


def _cache_key(payload: BurnoutRequest) -> str:
    data = {
        "hours": payload.study_log.daily_hours,
        "mood": payload.mood_description or "",
        "schedule": payload.daily_schedule.model_dump() if payload.daily_schedule else None,
    }
    return hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()


class BurnoutService:
    """Enhanced burnout analysis with advanced features, NLP, smart scheduler."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    def predict(self, payload: BurnoutRequest) -> BurnoutResponse:
        # Cache check
        key = _cache_key(payload)
        if key in _cache:
            logger.info("burnout cache hit")
            return _cache[key]

        hours = np.array(payload.study_log.daily_hours, dtype=float)
        features = _compute_features(hours)
        schedule_features = _compute_schedule_features(payload.daily_schedule)

        # ── ML prediction ────────────────────────────────────────────────────
        model = self._registry.get("burnout_model")
        burnout_level = 0.0
        if model is not None:
            try:
                feat_vec = [[
                    features["mean_hours"],
                    features["std_hours"],
                    features["max_hours"],
                    features["min_hours"],
                    features["consistency_score"],
                ]]
                if hasattr(model, "predict_proba"):
                    burnout_level = float(model.predict_proba(feat_vec)[0][1])
                else:
                    burnout_level = float(model.predict(feat_vec)[0]) / 2.0
            except Exception as exc:
                logger.warning("burnout_model inference failed", extra={"error": str(exc)})
                burnout_level = _rule_based_level(features["mean_hours"])
        else:
            burnout_level = _rule_based_level(features["mean_hours"])

        burnout_risk = _level_to_risk(burnout_level)

        # ── NLP mood analysis ─────────────────────────────────────────────────
        mood = _analyse_mood(payload.mood_description or "")

        # Boost burnout level if mood is very negative
        if mood["sentiment"] == "negative" and mood["score"] < -0.3:
            burnout_level = min(burnout_level + 0.15, 1.0)
            burnout_risk = _level_to_risk(burnout_level)

        # ── Smart schedule ────────────────────────────────────────────────────
        schedule = _generate_schedule(payload.daily_schedule, burnout_risk)

        # ── Recommendations & insights ────────────────────────────────────────
        recs = _generate_recommendations(features, schedule_features, burnout_risk, mood)
        insight = _human_insight(burnout_risk, features["consistency_score"], mood)

        result = BurnoutResponse(
            consistency_score=round(features["consistency_score"], 4),
            burnout_risk=burnout_risk,
            burnout_level=round(burnout_level, 4),
            workload_ratio=schedule_features["workload_ratio"],
            rest_efficiency=schedule_features["rest_efficiency"],
            overwork_detected=schedule_features["overwork"],
            sleep_deprivation_detected=schedule_features["sleep_deprivation"],
            emotion_analysis=mood,
            optimized_schedule=schedule,
            recommendations=recs,
            insights=insight,
        )

        # Store in cache (evict oldest if full)
        if len(_cache) >= _CACHE_MAX:
            oldest = next(iter(_cache))
            del _cache[oldest]
        _cache[key] = result

        return result


# ── Helpers ───────────────────────────────────────────────────────────────────
def _rule_based_level(mean_hours: float) -> float:
    if mean_hours > 10:
        return 0.85
    elif mean_hours > 8:
        return 0.65
    elif mean_hours > 5:
        return 0.40
    return 0.20


def _level_to_risk(level: float) -> str:
    if level >= 0.60:
        return "High"
    elif level >= 0.35:
        return "Medium"
    return "Low"
