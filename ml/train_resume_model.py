"""
Resume Analysis Model Training Script

This script trains NLP models for resume analysis.
Tasks: Skill extraction, keyword matching, scoring against job descriptions
Models: TF-IDF + Cosine Similarity, BERT embeddings (if available)
Output: Resume score, missing skills, improvement suggestions
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import re
import os

# Create models directory if not exists
os.makedirs('ml_models/resume_engine', exist_ok=True)

# Predefined skills vocabulary
SKILLS_VOCAB = [
    'python', 'java', 'javascript', 'c++', 'c#', 'sql', 'html', 'css', 'react', 'angular',
    'node.js', 'django', 'flask', 'spring', 'hibernate', 'machine learning', 'deep learning',
    'data science', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'docker',
    'kubernetes', 'aws', 'azure', 'git', 'linux', 'agile', 'scrum', 'problem solving',
    'communication', 'teamwork', 'leadership', 'project management'
]

def generate_resume_data(n_samples=1000):
    """Generate synthetic resume and job description data"""
    np.random.seed(42)

    resumes = []
    job_descriptions = []
    scores = []

    for _ in range(n_samples):
        # Generate resume text
        resume_skills = np.random.choice(SKILLS_VOCAB, size=np.random.randint(3, 10), replace=False)
        resume_text = f"I am a software engineer with experience in {', '.join(resume_skills)}. " \
                     f"I have worked on various projects using these technologies."

        # Generate job description
        job_skills = np.random.choice(SKILLS_VOCAB, size=np.random.randint(4, 12), replace=False)
        job_text = f"We are looking for a developer proficient in {', '.join(job_skills)}. " \
                   f"The ideal candidate should have experience with these technologies."

        # Calculate similarity score (0-100)
        common_skills = len(set(resume_skills) & set(job_skills))
        total_skills = len(set(resume_skills) | set(job_skills))
        similarity = common_skills / total_skills if total_skills > 0 else 0
        score = similarity * 100 + np.random.normal(0, 10)  # Add noise
        score = np.clip(score, 0, 100)

        resumes.append(resume_text)
        job_descriptions.append(job_text)
        scores.append(score)

    df = pd.DataFrame({
        'resume_text': resumes,
        'job_description': job_descriptions,
        'resume_score': scores
    })

    return df

def extract_skills(text, skills_vocab):
    """Extract skills from text"""
    text_lower = text.lower()
    found_skills = [skill for skill in skills_vocab if skill in text_lower]
    return found_skills

def preprocess_text(text):
    """Basic text preprocessing"""
    # Remove special characters and extra spaces
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text.lower()

def train_tfidf_model(df):
    """Train TF-IDF vectorizer and similarity model"""
    # Combine resume and job description for vectorizer training
    all_texts = df['resume_text'].tolist() + df['job_description'].tolist()

    # Preprocess texts
    processed_texts = [preprocess_text(text) for text in all_texts]

    # Train TF-IDF vectorizer
    vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
    vectorizer.fit(processed_texts)

    # Transform resume and job texts
    resume_vectors = vectorizer.transform([preprocess_text(text) for text in df['resume_text']])
    job_vectors = vectorizer.transform([preprocess_text(text) for text in df['job_description']])

    # Calculate cosine similarities
    similarities = []
    for i in range(len(df)):
        sim = cosine_similarity(resume_vectors[i], job_vectors[i])[0][0]
        similarities.append(sim * 100)  # Convert to percentage

    return vectorizer, similarities

def train_scoring_model(df, similarities):
    """Train a model to predict resume score based on similarity"""
    X = np.array(similarities).reshape(-1, 1)
    y = df['resume_score'].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LinearRegression()
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"Resume Scoring Model - MSE: {mse:.4f}, R²: {r2:.4f}")

    return model

def find_missing_skills(resume_skills, job_skills):
    """Find skills present in job but missing from resume"""
    return list(set(job_skills) - set(resume_skills))

def generate_improvement_suggestions(missing_skills, resume_score):
    """Generate improvement suggestions based on missing skills and score"""
    suggestions = []

    if resume_score < 50:
        suggestions.append("Focus on gaining more relevant technical skills")
    if len(missing_skills) > 5:
        suggestions.append("Consider learning additional technologies mentioned in job descriptions")
    if 'communication' in missing_skills:
        suggestions.append("Work on improving communication skills")
    if 'leadership' in missing_skills:
        suggestions.append("Develop leadership and project management skills")

    return suggestions

def main():
    # Generate data
    print("Generating synthetic resume data...")
    df = generate_resume_data(1500)

    # Train TF-IDF model
    print("Training TF-IDF vectorizer...")
    vectorizer, similarities = train_tfidf_model(df)

    # Train scoring model
    print("Training resume scoring model...")
    scoring_model = train_scoring_model(df, similarities)

    # Save models
    print("Saving models...")
    joblib.dump(vectorizer, 'ml_models/resume_engine/tfidf_vectorizer.joblib')
    joblib.dump(scoring_model, 'ml_models/resume_engine/resume_scorer.joblib')
    joblib.dump(SKILLS_VOCAB, 'ml_models/resume_engine/skills_vocab.joblib')

    print("Models saved successfully!")

    # Test inference
    print("Testing inference...")
    sample_resume = df['resume_text'].iloc[0]
    sample_job = df['job_description'].iloc[0]

    # Extract skills
    resume_skills = extract_skills(sample_resume, SKILLS_VOCAB)
    job_skills = extract_skills(sample_job, SKILLS_VOCAB)

    # Calculate similarity
    resume_vec = vectorizer.transform([preprocess_text(sample_resume)])
    job_vec = vectorizer.transform([preprocess_text(sample_job)])
    similarity = cosine_similarity(resume_vec, job_vec)[0][0] * 100

    # Predict score
    predicted_score = scoring_model.predict([[similarity]])[0]

    # Find missing skills and suggestions
    missing = find_missing_skills(resume_skills, job_skills)
    suggestions = generate_improvement_suggestions(missing, predicted_score)

    print(f"Resume Score: {predicted_score:.2f}")
    print(f"Resume Skills: {resume_skills}")
    print(f"Missing Skills: {missing}")
    print(f"Suggestions: {suggestions}")

if __name__ == "__main__":
    main()