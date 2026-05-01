"""Placement prediction — XGBoost vs RandomForest vs LogisticRegression comparison."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
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

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    models = {
        "RandomForest": RandomForestClassifier(
            n_estimators=300,
            max_depth=12,
            class_weight="balanced_subsample",
            random_state=42,
            n_jobs=-1,
        ),
        "LogisticRegression": LogisticRegression(
            random_state=42,
            class_weight="balanced",
            max_iter=1000,
        ),
    }

    def _load_xgboost() -> type | None:
        try:
            from xgboost import XGBClassifier  # type: ignore
            return XGBClassifier
        except Exception as exc:
            error_text = str(exc)
            if "libomp.dylib" in error_text or "OpenMP" in error_text:
                print(
                    "  [placement] xgboost is installed but missing libomp. "
                    "Install it with `brew install libomp` or skip XGBoost."
                )
            else:
                print(f"  [placement] xgboost not available — skipping XGBoost ({exc.__class__.__name__})")
            return None

    XGBClassifier = _load_xgboost()
    if XGBClassifier is not None:
        models["XGBoost"] = XGBClassifier(
            n_estimators=250,
            max_depth=6,
            learning_rate=0.08,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
            verbosity=0,
        )

    best_name, best_model, best_score = None, None, -np.inf
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, model in models.items():
        fit_X = X_train_s if name == "LogisticRegression" else X_train
        eval_X = X_test_s if name == "LogisticRegression" else X_test
        if name == "XGBoost":
            fit_X = X_train
            eval_X = X_test

        try:
            cv_scores = cross_val_score(
                model,
                X_train_s if name == "LogisticRegression" else X_train,
                y_train,
                cv=cv,
                scoring="f1_weighted",
                n_jobs=-1,
            )
        except Exception:
            cv_scores = np.array([-np.inf])

        model.fit(fit_X, y_train)
        y_pred = model.predict(eval_X)
        y_proba = model.predict_proba(eval_X)[:, 1]

        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        auc = roc_auc_score(y_test, y_proba)

        print(f"  [placement] {name}: CV F1={cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        print(f"  [placement] {name}: Accuracy={accuracy:.4f}, Precision={precision:.4f}, Recall={recall:.4f}, F1={f1:.4f}, AUC={auc:.4f}")
        print(classification_report(y_test, y_pred, target_names=["Not Placed", "Placed"], zero_division=0))

        if f1 > best_score:
            best_score, best_name, best_model = f1, name, model

    print(f"  [placement] Best model: {best_name} (F1={best_score:.4f})")

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
