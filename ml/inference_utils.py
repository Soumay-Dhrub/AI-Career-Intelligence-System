"""
ML Model Inference Utilities

This module provides inference functions for all ML models in the Career Intelligence System.
Each function loads the trained model and performs predictions.
"""

import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
import os

# Model paths
MODEL_DIR = 'ml_models'

def load_placement_models():
    """Load placement prediction models"""
    classifier = joblib.load(f'{MODEL_DIR}/placement_engine/placement_classifier.joblib')
    regressor = joblib.load(f'{MODEL_DIR}/placement_engine/placement_regressor.joblib')
    scaler = joblib.load(f'{MODEL_DIR}/placement_engine/scaler.joblib')
    features = joblib.load(f'{MODEL_DIR}/placement_engine/features.joblib')
    return classifier, regressor, scaler, features

def predict_placement_probability(student_data: Dict[str, float]) -> Tuple[float, str]:
    """
    Predict placement probability and risk category

    Args:
        student_data: Dict with keys: cgpa, dsa_score, aptitude_score,
                     projects_count, internship_count, resume_score,
                     communication_score, leadership_score

    Returns:
        Tuple of (probability, risk_category)
    """
    classifier, regressor, scaler, features = load_placement_models()

    # Prepare input
    input_data = [[student_data[feat] for feat in features]]
    input_scaled = scaler.transform(input_data)

    # Predict probability
    probability = regressor.predict(input_scaled)[0]

    # Get risk category
    if probability >= 0.7:
        risk = "Low"
    elif probability >= 0.4:
        risk = "Medium"
    else:
        risk = "High"

    return float(probability), risk

def load_resume_models():
    """Load resume analysis models"""
    vectorizer = joblib.load(f'{MODEL_DIR}/resume_engine/tfidf_vectorizer.joblib')
    scorer = joblib.load(f'{MODEL_DIR}/resume_engine/resume_scorer.joblib')
    skills_vocab = joblib.load(f'{MODEL_DIR}/resume_engine/skills_vocab.joblib')
    return vectorizer, scorer, skills_vocab

def analyze_resume(resume_text: str, job_description: str) -> Dict[str, Any]:
    """
    Analyze resume against job description

    Args:
        resume_text: Resume content
        job_description: Job description content

    Returns:
        Dict with score, skills, missing skills, suggestions
    """
    vectorizer, scorer, skills_vocab = load_resume_models()

    def extract_skills(text: str) -> List[str]:
        text_lower = text.lower()
        return [skill for skill in skills_vocab if skill in text_lower]

    def preprocess_text(text: str) -> str:
        import re
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text.lower()

    # Extract skills
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_description)

    # Calculate similarity
    resume_vec = vectorizer.transform([preprocess_text(resume_text)])
    job_vec = vectorizer.transform([preprocess_text(job_description)])
    from sklearn.metrics.pairwise import cosine_similarity
    similarity = cosine_similarity(resume_vec, job_vec)[0][0] * 100

    # Predict score
    predicted_score = scorer.predict([[similarity]])[0]

    # Find missing skills
    missing_skills = list(set(job_skills) - set(resume_skills))

    # Generate suggestions
    suggestions = []
    if predicted_score < 50:
        suggestions.append("Focus on gaining more relevant technical skills")
    if len(missing_skills) > 5:
        suggestions.append("Consider learning additional technologies mentioned in job descriptions")
    if 'communication' in missing_skills:
        suggestions.append("Work on improving communication skills")

    return {
        'resume_score': float(predicted_score),
        'resume_skills': resume_skills,
        'missing_skills': missing_skills,
        'improvement_suggestions': suggestions
    }

def load_behavioral_models():
    """Load behavioral analysis models"""
    model = joblib.load(f'{MODEL_DIR}/consistency/burnout_model.joblib')
    scaler = joblib.load(f'{MODEL_DIR}/consistency/behavioral_scaler.joblib')
    features = joblib.load(f'{MODEL_DIR}/consistency/behavioral_features.joblib')
    return model, scaler, features

def analyze_behavioral_patterns(daily_hours: List[float]) -> Tuple[float, str]:
    """
    Analyze behavioral patterns for consistency and burnout risk

    Args:
        daily_hours: List of daily study hours for 30 days

    Returns:
        Tuple of (consistency_score, burnout_risk)
    """
    model, scaler, features = load_behavioral_models()

    # Calculate consistency score
    hours = np.array(daily_hours)
    mean_h = np.mean(hours)
    std_h = np.std(hours)

    if mean_h == 0:
        consistency_score = 0.0
    else:
        cv = std_h / mean_h
        consistency_score = float(np.clip(1.0 - cv, 0.0, 1.0))

    # Prepare input for burnout prediction
    input_data = {
        'mean_hours': mean_h,
        'std_hours': std_h,
        'max_hours': np.max(hours),
        'min_hours': np.min(hours),
        'total_hours': np.sum(hours),
        'coefficient_of_variation': cv
    }

    input_df = pd.DataFrame([input_data])
    X = input_df[features]
    X_scaled = scaler.transform(X)

    # Predict burnout risk
    risk_numeric = model.predict(X_scaled)[0]
    risk_mapping = {0: "Low", 1: "Medium", 2: "High"}
    burnout_risk = risk_mapping[risk_numeric]

    return consistency_score, burnout_risk

def load_internship_models():
    """Load internship impact models"""
    model = joblib.load(f'{MODEL_DIR}/internship/rf_model.joblib')
    scaler = joblib.load(f'{MODEL_DIR}/internship/internship_scaler.joblib')
    features = joblib.load(f'{MODEL_DIR}/internship/internship_features.joblib')
    company_encoder = joblib.load(f'{MODEL_DIR}/internship/company_encoder.joblib')
    domain_encoder = joblib.load(f'{MODEL_DIR}/internship/domain_encoder.joblib')
    return model, scaler, features, company_encoder, domain_encoder

def predict_internship_impact(internship_data: Dict[str, Any]) -> float:
    """
    Predict internship impact on placement chances

    Args:
        internship_data: Dict with company, domain, duration_months, etc.

    Returns:
        Impact score (0-1)
    """
    model, scaler, features, company_encoder, domain_encoder = load_internship_models()

    # Encode categorical inputs
    input_encoded = internship_data.copy()
    input_encoded['company_encoded'] = company_encoder.transform([internship_data['company']])[0]
    input_encoded['domain_encoded'] = domain_encoder.transform([internship_data['domain']])[0]

    # Prepare features
    X = [[input_encoded[feat] for feat in features]]
    X_scaled = scaler.transform(X)

    # Predict
    impact_score = model.predict(X_scaled)[0]

    return float(impact_score)

def load_failure_models():
    """Load failure analysis models"""
    model = joblib.load(f'{MODEL_DIR}/failure_analysis/dt_model.joblib')
    scaler = joblib.load(f'{MODEL_DIR}/failure_analysis/failure_scaler.joblib')
    features = joblib.load(f'{MODEL_DIR}/failure_analysis/failure_features.joblib')
    return model, scaler, features

def analyze_failure_reasons(student_data: Dict[str, float]) -> List[str]:
    """
    Analyze potential failure reasons using feature importance

    Args:
        student_data: Student performance data

    Returns:
        List of failure reasons
    """
    model, scaler, features = load_failure_models()

    # Get feature importances
    importances = model.feature_importances_
    importance_dict = dict(zip(features, importances))
    sorted_importances = sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)

    # Identify key failure reasons
    failure_reasons = []
    thresholds = {
        'cgpa': 7.0,
        'dsa_score': 50,
        'aptitude_score': 50,
        'communication_score': 50,
        'projects_count': 3,
        'internship_count': 1,
        'resume_score': 50,
        'interview_performance': 50,
        'consistency_score': 0.5
    }

    reason_mapping = {
        'cgpa': 'Low CGPA',
        'dsa_score': 'Weak coding skills',
        'aptitude_score': 'Poor aptitude',
        'communication_score': 'Weak communication skills',
        'projects_count': 'Insufficient projects',
        'internship_count': 'Lack of internship experience',
        'resume_score': 'Poor resume quality',
        'interview_performance': 'Bad interview performance',
        'consistency_score': 'Inconsistent study pattern'
    }

    for feature, importance in sorted_importances[:5]:
        if feature in student_data and feature in thresholds:
            value = student_data[feature]
            if value < thresholds[feature] and feature in reason_mapping:
                failure_reasons.append(reason_mapping[feature])

    return failure_reasons[:3]

def load_roadmap_models():
    """Load roadmap generation models"""
    similarity_matrix = joblib.load(f'{MODEL_DIR}/roadmap/cf_model.joblib')
    all_skills = joblib.load(f'{MODEL_DIR}/roadmap/skills_list.joblib')
    skill_to_idx = joblib.load(f'{MODEL_DIR}/roadmap/skill_to_idx.joblib')
    skills_database = joblib.load(f'{MODEL_DIR}/roadmap/skills_database.joblib')
    return similarity_matrix, all_skills, skill_to_idx, skills_database

def generate_personalized_roadmap(student_profile: Dict[str, Any], skill_gaps: List[str]) -> List[Dict[str, Any]]:
    """
    Generate personalized learning roadmap

    Args:
        student_profile: Student background info
        skill_gaps: List of skills to learn

    Returns:
        List of roadmap items with priority, timeline, difficulty
    """
    similarity_matrix, all_skills, skill_to_idx, skills_database = load_roadmap_models()

    # Rule-based prioritization
    priority_weights = {
        'Data structures': 10,
        'Basic algorithms': 9,
        'Advanced Python': 8,
        'System design': 9,
        'REST APIs': 7,
        'Testing fundamentals': 6,
        'DevOps': 8,
        'Cloud fundamentals (AWS/Azure)': 7,
        'Machine Learning': 8,
        'Leadership skills': 5
    }

    # Calculate priority scores
    roadmap_items = []
    for gap in skill_gaps:
        priority = priority_weights.get(gap, 5)

        # Adjust based on student profile
        if student_profile.get('coding_skill', 50) < 50 and 'Python' in gap:
            priority += 2
        if student_profile.get('project_experience', 5) < 3 and 'design' in gap.lower():
            priority += 2

        roadmap_items.append({
            'topic': gap,
            'priority': priority,
            'estimated_weeks': max(1, priority // 2),
            'difficulty': 'beginner' if priority < 6 else 'intermediate' if priority < 8 else 'advanced'
        })

    # Sort by priority
    roadmap_items.sort(key=lambda x: x['priority'], reverse=True)

    return roadmap_items