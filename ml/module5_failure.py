"""Failure analysis — ensemble classification with SHAP feature importance."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import classification_report, f1_score, precision_score, recall_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MODEL_DIR = Path(__file__).parent.parent / "ml_models" / "failure_analysis"

FEATURES = ["avg_score", "min_score", "max_score", "backlogs", "project_failures", "num_below_50"]
TARGET = "failure_class"


def train(df: pd.DataFrame) -> None:
    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    candidates = {
        "RandomForest": RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            min_samples_leaf=5,
            class_weight="balanced_subsample",
            random_state=42,
            n_jobs=-1,
        ),
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.08,
            subsample=0.85,
            random_state=42,
        ),
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    best_name, best_model, best_f1 = None, None, -np.inf

    for name, clf in candidates.items():
        cv_scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring="f1_weighted", n_jobs=-1)
        print(f"  [failure] {name}: CV F1={cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

        clf.fit(X_train, y_train)
        preds = clf.predict(X_test)
        f1 = f1_score(y_test, preds, average="weighted", zero_division=0)
        precision = precision_score(y_test, preds, average="weighted", zero_division=0)
        recall = recall_score(y_test, preds, average="weighted", zero_division=0)

        print(f"  [failure] {name}: Accuracy={clf.score(X_test, y_test):.4f}, Precision={precision:.4f}, Recall={recall:.4f}, F1={f1:.4f}")
        print(classification_report(y_test, preds, target_names=["No Issue", "Poor Overall", "Inconsistent", "Critical"], zero_division=0))

        if f1 > best_f1:
            best_f1, best_name, best_model = f1, name, clf

    print(f"  [failure] Best model: {best_name} (F1={best_f1:.4f})")

    model = best_model
    # SHAP feature importance (optional — graceful fallback)
    try:
        import shap  # type: ignore
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test[:100])
        mean_abs = np.abs(shap_values).mean(axis=(0, 2)) if shap_values.ndim == 3 else np.abs(shap_values).mean(axis=0)
        importance = dict(zip(FEATURES, mean_abs.tolist()))
        print(f"  [failure] SHAP importances: {importance}")
    except ImportError:
        print("  [failure] shap not installed — skipping SHAP analysis")
    except Exception as exc:
        print(f"  [failure] SHAP failed: {exc}")

    out_path = MODEL_DIR / "dt_model.joblib"
    joblib.dump(model, out_path)
    print(f"  [failure] Saved → {out_path}")


def run() -> None:
    df = pd.read_csv(DATASETS_DIR / "failure.csv")
    print(f"[failure] Training on {len(df)} samples …")
    train(df)


if __name__ == "__main__":
    run()
