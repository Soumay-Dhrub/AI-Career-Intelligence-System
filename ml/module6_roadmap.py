"""Roadmap generation — training a stronger skill priority regressor."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MODEL_DIR = Path(__file__).parent.parent / "ml_models" / "roadmap"

FEATURES = ["skill_idx"]
TARGET = "priority_score"


def train(df: pd.DataFrame) -> None:
    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    candidates = {
        "Ridge": Ridge(alpha=1.0),
        "RandomForest": RandomForestRegressor(
            n_estimators=200,
            max_depth=8,
            random_state=42,
            n_jobs=-1,
        ),
    }

    best_name, best_model, best_mae = None, None, np.inf
    for name, model in candidates.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        r2 = r2_score(y_test, preds)
        print(f"  [roadmap] {name}: MAE={mae:.4f}, R²={r2:.4f}")

        if mae < best_mae:
            best_mae, best_name, best_model = mae, name, model

    print(f"  [roadmap] Best model: {best_name} (MAE={best_mae:.4f})")

    out_path = MODEL_DIR / "cf_model.joblib"
    joblib.dump(best_model, out_path)
    print(f"  [roadmap] Saved → {out_path}")


def run() -> None:
    df = pd.read_csv(DATASETS_DIR / "roadmap.csv")
    print(f"[roadmap] Training on {len(df)} samples …")
    train(df)


if __name__ == "__main__":
    run()
