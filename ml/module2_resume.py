"""Resume analysis — fits and saves TF-IDF vectorizer on synthetic corpus."""
from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split

DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MODEL_DIR = Path(__file__).parent.parent / "ml_models" / "resume_engine"

SKILLS_VOCAB = [
    'python', 'java', 'javascript', 'c++', 'c#', 'sql', 'html', 'css', 'react', 'angular',
    'node.js', 'django', 'flask', 'spring', 'hibernate', 'machine learning', 'deep learning',
    'data science', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'docker',
    'kubernetes', 'aws', 'azure', 'git', 'linux', 'agile', 'scrum', 'problem solving',
    'communication', 'teamwork', 'leadership', 'project management'
]


def extract_skills(text: str, skills_vocab: list[str]) -> list[str]:
    text_lower = text.lower()
    return [skill for skill in skills_vocab if skill in text_lower]


def preprocess_text(text: str) -> str:
    return text.lower()


def build_features(df: pd.DataFrame, similarities: list[float]) -> np.ndarray:
    X = []
    for idx in range(len(df)):
        resume_text = df['resume'].iloc[idx]
        jd_text = df['jd'].iloc[idx]
        resume_skills = extract_skills(resume_text, SKILLS_VOCAB)
        job_skills = extract_skills(jd_text, SKILLS_VOCAB)
        overlap = len(set(resume_skills) & set(job_skills))
        missing = len(set(job_skills) - set(resume_skills))
        resume_len = len(resume_text.split())
        job_len = len(jd_text.split())
        X.append([similarities[idx], overlap, missing, resume_len, job_len])
    return np.array(X)


def train(df: pd.DataFrame) -> None:
    corpus = pd.concat([df['resume'], df['jd']], ignore_index=True).tolist()
    processed_texts = [preprocess_text(text) for text in corpus]

    vectorizer = TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),
        max_features=10000,
        sublinear_tf=True,
    )
    vectorizer.fit(processed_texts)

    resume_vectors = vectorizer.transform([preprocess_text(text) for text in df['resume']])
    job_vectors = vectorizer.transform([preprocess_text(text) for text in df['jd']])

    similarities = []
    for i in range(len(df)):
        sim = cosine_similarity(resume_vectors[i], job_vectors[i])[0][0]
        similarities.append(sim * 100)

    X = build_features(df, similarities)
    y = np.array(similarities)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"  [resume] Vocabulary size: {len(vectorizer.vocabulary_)}")
    print(f"  [resume] Resume scoring model - MSE: {mse:.4f}, R²: {r2:.4f}")

    joblib.dump(vectorizer, MODEL_DIR / 'tfidf_vectorizer.joblib')
    joblib.dump(model, MODEL_DIR / 'resume_scorer.joblib')
    joblib.dump(SKILLS_VOCAB, MODEL_DIR / 'skills_vocab.joblib')
    print(f"  [resume] Saved → {MODEL_DIR / 'tfidf_vectorizer.joblib'}")
    print(f"  [resume] Saved → {MODEL_DIR / 'resume_scorer.joblib'}")


def run() -> None:
    df = pd.read_csv(DATASETS_DIR / "tfidf_corpus.csv")
    print(f"[resume] Training on {len(df)} resume/JD pairs …")
    train(df)


if __name__ == "__main__":
    run()
