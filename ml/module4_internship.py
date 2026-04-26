"""Internship impact — RandomForest regression vs GradientBoosting comparison."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MODEL_DIR = Path(__file__).parent.parent / "ml_models" / "internship"

FEATURES = ["duration_months", "company_tier", "role_relevance", "project_count"]
TARGET = "internship_score"


def train(df: pd.DataFrame) -> None:
    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    models = {
        "RandomForest": RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42, n_jobs=-1),
        "GradientBoosting": GradientBoostingRegressor(n_estimators=150, max_depth=5, random_state=42),
    }

    best_name, best_model, best_r2 = None, None, -np.inf
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        r2 = r2_score(y_test, preds)
        print(f"  [internship] {name}: MAE={mae:.4f}, R²={r2:.4f}")
        if r2 > best_r2:
            best_r2, best_name, best_model = r2, name, model

    print(f"  [internship] Best model: {best_name} (R²={best_r2:.4f})")

    out_path = MODEL_DIR / "rf_model.joblib"
    joblib.dump(best_model, out_path)
    print(f"  [internship] Saved → {out_path}")


def run() -> None:
    df = pd.read_csv(DATASETS_DIR / "internship.csv")
    print(f"[internship] Training on {len(df)} samples …")
    train(df)


if __name__ == "__main__":
    run()
