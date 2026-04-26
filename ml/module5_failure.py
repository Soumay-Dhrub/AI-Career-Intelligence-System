"""Failure analysis — Decision Tree with SHAP feature importance."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, f1_score
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MODEL_DIR = Path(__file__).parent.parent / "ml_models" / "failure_analysis"

FEATURES = ["avg_score", "min_score", "max_score", "backlogs", "project_failures", "num_below_50"]
TARGET = "failure_class"


def train(df: pd.DataFrame) -> None:
    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = DecisionTreeClassifier(max_depth=6, min_samples_leaf=10, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    f1 = f1_score(y_test, preds, average="weighted")
    print(f"  [failure] DecisionTree: weighted-F1={f1:.4f}")
    print(classification_report(y_test, preds, target_names=["No Issue", "Poor Overall", "Inconsistent", "Critical"]))

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
