"""Master training script — generates data and trains all 6 ML modules."""
from __future__ import annotations

import sys
import time
from pathlib import Path

# Ensure project root is on sys.path so backend imports work
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from ml.data_generator import save_all as generate_datasets
from ml.module1_placement import run as train_placement
from ml.module2_resume import run as train_resume
from ml.module3_burnout import run as train_burnout
from ml.module4_internship import run as train_internship
from ml.module5_failure import run as train_failure
from ml.module6_roadmap import run as train_roadmap


def main() -> None:
    total_start = time.time()

    print("=" * 60)
    print("  AI Placement Readiness — ML Training Pipeline")
    print("=" * 60)

    # Step 1: Generate synthetic datasets
    print("\n[1/7] Generating synthetic datasets …")
    generate_datasets()

    # Step 2: Train each module
    steps = [
        ("[2/7] Placement prediction", train_placement),
        ("[3/7] Resume TF-IDF vectorizer", train_resume),
        ("[4/7] Burnout / consistency model", train_burnout),
        ("[5/7] Internship impact model", train_internship),
        ("[6/7] Failure analysis model", train_failure),
        ("[7/7] Roadmap recommendation model", train_roadmap),
    ]

    for label, fn in steps:
        print(f"\n{label} …")
        t0 = time.time()
        fn()
        print(f"  Done in {time.time() - t0:.1f}s")

    print("\n" + "=" * 60)
    print(f"  All models trained in {time.time() - total_start:.1f}s")
    print("  Models saved to ml_models/")
    print("=" * 60)


if __name__ == "__main__":
    main()
