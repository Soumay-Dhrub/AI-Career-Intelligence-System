"""Internship impact — RandomForest regression vs GradientBoosting comparison."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import KFold, train_test_split, cross_val_score

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MODEL_DIR = Path(__file__).parent.parent / "ml_models" / "internship"

FEATURES = ["duration_months", "company_tier", "role_relevance", "project_count"]
TARGET = "internship_score"


def train(df: pd.DataFrame) -> None:
    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    candidates = {
        "RandomForest": RandomForestRegressor(
            n_estimators=300,
            max_depth=10,
            min_samples_leaf=3,
            random_state=42,
            n_jobs=-1,
        ),
        "GradientBoosting": GradientBoostingRegressor(
            n_estimators=250,
            max_depth=6,
            learning_rate=0.08,
            subsample=0.85,
            random_state=42,
        ),
    }

    best_name, best_model, best_r2 = None, None, -np.inf
    cv = KFold(n_splits=5, shuffle=True, random_state=42)

    for name, model in candidates.items():
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="r2", n_jobs=-1)
        print(f"  [internship] {name}: CV R²={cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

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
