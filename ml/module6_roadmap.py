"""Roadmap generation — lightweight collaborative-filtering proxy using Ridge regression."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MODEL_DIR = Path(__file__).parent.parent / "ml_models" / "roadmap"

FEATURES = ["skill_idx"]
TARGET = "priority_score"


def train(df: pd.DataFrame) -> None:
    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    print(f"  [roadmap] Ridge: MAE={mae:.4f}")

    # The service calls model.predict([[i] for i in range(len(skills))])
    # and sorts by score — Ridge returns a float per skill index, which is correct.
    out_path = MODEL_DIR / "cf_model.joblib"
    joblib.dump(model, out_path)
    print(f"  [roadmap] Saved → {out_path}")


def run() -> None:
    df = pd.read_csv(DATASETS_DIR / "roadmap.csv")
    print(f"[roadmap] Training on {len(df)} samples …")
    train(df)


if __name__ == "__main__":
    run()
