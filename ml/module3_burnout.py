"""Burnout / consistency analysis — XGBoost + GradientBoosting with cross-validation."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

try:
    from xgboost import XGBClassifier
    _HAS_XGB = True
except ImportError:
    _HAS_XGB = False

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MODEL_DIR = Path(__file__).parent.parent / "ml_models" / "consistency"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Enhanced feature set
FEATURES = [
    "mean_hours", "std_hours", "max_hours", "min_hours",
    "consistency_score", "workload_ratio", "rest_efficiency", "overwork_days",
]
TARGET = "burnout_label"


def train(df: pd.DataFrame) -> None:
    # Fill missing columns for backward compat
    for col in FEATURES:
        if col not in df.columns:
            df[col] = 0.0

    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    candidates = {
        "RandomForest": RandomForestClassifier(
            n_estimators=300, max_depth=8, min_samples_leaf=3,
            random_state=42, n_jobs=-1
        ),
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=200, max_depth=5, learning_rate=0.08,
            subsample=0.85, random_state=42
        ),
    }
    if _HAS_XGB:
        candidates["XGBoost"] = XGBClassifier(
            n_estimators=250, max_depth=6, learning_rate=0.08,
            subsample=0.85, colsample_bytree=0.85,
            use_label_encoder=False, eval_metric="mlogloss",
            random_state=42, n_jobs=-1,
        )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    best_name, best_model, best_f1 = None, None, -1.0

    for name, clf in candidates.items():
        cv_scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring="f1_weighted", n_jobs=-1)
        print(f"  [burnout] {name}: CV F1={cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        clf.fit(X_train, y_train)
        preds = clf.predict(X_test)
        test_f1 = f1_score(y_test, preds, average="weighted")
        print(f"  [burnout] {name}: Test F1={test_f1:.4f}")
        print(classification_report(y_test, preds, target_names=["Low", "Medium", "High"]))
        if cv_scores.mean() > best_f1:
            best_f1, best_name, best_model = cv_scores.mean(), name, clf

    print(f"  [burnout] Best model: {best_name} (CV F1={best_f1:.4f})")

    wrapper = _BurnoutWrapper(best_model)
    out_path = MODEL_DIR / "burnout_model.joblib"
    joblib.dump(wrapper, out_path)
    print(f"  [burnout] Saved → {out_path}")


class _BurnoutWrapper:
    """Wraps classifier; predict_proba returns (n,2) where col-1 = P(Medium or High)."""

    def __init__(self, clf) -> None:
        self.clf = clf

    def predict_proba(self, X):
        proba = self.clf.predict_proba(X)   # shape (n, 3)
        p_low = proba[:, 0]
        p_burnout = 1.0 - p_low
        return np.column_stack([p_low, p_burnout])

    def predict(self, X):
        return self.clf.predict(X)


def run() -> None:
    df = pd.read_csv(DATASETS_DIR / "burnout.csv")
    print(f"[burnout] Training on {len(df)} samples with {len(FEATURES)} features …")
    train(df)


if __name__ == "__main__":
    run()
