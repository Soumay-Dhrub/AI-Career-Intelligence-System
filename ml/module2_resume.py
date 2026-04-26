"""Resume analysis — fits and saves TF-IDF vectorizer on synthetic corpus."""
from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MODEL_DIR = Path(__file__).parent.parent / "ml_models" / "resume_engine"


def train(df: pd.DataFrame) -> None:
    corpus = pd.concat([df["resume"], df["jd"]], ignore_index=True).tolist()

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True,
    )
    vectorizer.fit(corpus)

    # Quick sanity check
    sample_vecs = vectorizer.transform([corpus[0], corpus[1]])
    sim = cosine_similarity(sample_vecs[0], sample_vecs[1])[0][0]
    print(f"  [resume] Vocabulary size: {len(vectorizer.vocabulary_)}")
    print(f"  [resume] Sample cosine similarity: {sim:.4f}")

    out_path = MODEL_DIR / "tfidf_vectorizer.joblib"
    joblib.dump(vectorizer, out_path)
    print(f"  [resume] Saved → {out_path}")


def run() -> None:
    df = pd.read_csv(DATASETS_DIR / "tfidf_corpus.csv")
    print(f"[resume] Fitting TF-IDF on {len(df)} resume/JD pairs …")
    train(df)


if __name__ == "__main__":
    run()
