"""Placement prediction — XGBoost vs RandomForest vs LogisticRegression comparison."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MODEL_DIR = Path(__file__).parent.parent / "ml_models" / "placement_engine"

FEATURES = [
    "consistency_score", "resume_score", "internship_score",
    "placement_boost", "burnout_risk_encoded", "avg_subject_score",
]
TARGET = "placed"


def train(df: pd.DataFrame) -> None:
    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    models = {
        "RandomForest": RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42, n_jobs=-1),
        "LogisticRegression": LogisticRegression(max_iter=500, random_state=42),
    }

    # Try XGBoost if available
    try:
        from xgboost import XGBClassifier  # type: ignore
        models["XGBoost"] = XGBClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.05,
            use_label_encoder=False, eval_metric="logloss", random_state=42,
        )
    except ImportError:
        print("  [placement] xgboost not installed — skipping XGBoost")

    best_name, best_model, best_auc = None, None, -1.0
    for name, model in models.items():
        fit_X = X_train_s if name == "LogisticRegression" else X_train
        eval_X = X_test_s if name == "LogisticRegression" else X_test
        model.fit(fit_X, y_train)
        auc = roc_auc_score(y_test, model.predict_proba(eval_X)[:, 1])
        print(f"  [placement] {name}: AUC={auc:.4f}")
        print(classification_report(y_test, model.predict(eval_X), target_names=["Not Placed", "Placed"]))
        if auc > best_auc:
            best_auc, best_name, best_model = auc, name, model

    print(f"  [placement] Best model: {best_name} (AUC={best_auc:.4f})")

    # Wrap best model so predict_proba always works on raw (unscaled) features
    if best_name == "LogisticRegression":
        wrapper = _ScaledWrapper(scaler, best_model)
        joblib.dump(wrapper, MODEL_DIR / "xgb_model.joblib")
    else:
        joblib.dump(best_model, MODEL_DIR / "xgb_model.joblib")

    print(f"  [placement] Saved → {MODEL_DIR / 'xgb_model.joblib'}")


class _ScaledWrapper:
    """Wraps a scaler + classifier so the registry can call predict_proba on raw features."""

    def __init__(self, scaler: StandardScaler, clf) -> None:
        self.scaler = scaler
        self.clf = clf

    def predict_proba(self, X):
        return self.clf.predict_proba(self.scaler.transform(X))

    def predict(self, X):
        return self.clf.predict(self.scaler.transform(X))


def run() -> None:
    df = pd.read_csv(DATASETS_DIR / "placement.csv")
    print(f"[placement] Training on {len(df)} samples …")
    train(df)


if __name__ == "__main__":
    run()
