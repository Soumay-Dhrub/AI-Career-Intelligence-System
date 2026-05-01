"""
Failure Analysis Model Training Script

This script trains a model to analyze failure patterns and identify root causes.
Uses Random Forest for feature importance analysis.
Output: Key reasons for placement failure
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
import joblib
import os

# Create models directory if not exists
os.makedirs('ml_models/failure_analysis', exist_ok=True)

def generate_failure_data(n_samples=1000):
    """Generate synthetic student performance data with failure reasons"""
    np.random.seed(42)

    data = {
        'cgpa': np.random.uniform(4.0, 10.0, n_samples),
        'dsa_score': np.random.uniform(0, 100, n_samples),
        'aptitude_score': np.random.uniform(0, 100, n_samples),
        'communication_score': np.random.uniform(0, 100, n_samples),
        'projects_count': np.random.randint(0, 20, n_samples),
        'internship_count': np.random.randint(0, 5, n_samples),
        'resume_score': np.random.uniform(0, 100, n_samples),
        'interview_performance': np.random.uniform(0, 100, n_samples),
        'leadership_score': np.random.uniform(0, 100, n_samples),
        'consistency_score': np.random.uniform(0, 1, n_samples),
    }

    # Determine placement status and failure reasons
    failure_reasons = []

    for i in range(n_samples):
        reasons = []

        if data['cgpa'][i] < 7.0:
            reasons.append('low_cgpa')
        if data['dsa_score'][i] < 50:
            reasons.append('weak_coding')
        if data['aptitude_score'][i] < 50:
            reasons.append('poor_aptitude')
        if data['communication_score'][i] < 50:
            reasons.append('weak_communication')
        if data['projects_count'][i] < 3:
            reasons.append('few_projects')
        if data['internship_count'][i] < 1:
            reasons.append('no_internship')
        if data['resume_score'][i] < 50:
            reasons.append('poor_resume')
        if data['interview_performance'][i] < 50:
            reasons.append('bad_interview')
        if data['consistency_score'][i] < 0.5:
            reasons.append('inconsistent_study')

        # If no specific reasons, add a default
        if not reasons:
            reasons.append('other')

        failure_reasons.append(reasons)

        # Determine if placed (simplified logic)
        placed_score = (
            data['cgpa'][i] * 0.15 +
            data['dsa_score'][i] * 0.2 +
            data['aptitude_score'][i] * 0.15 +
            data['communication_score'][i] * 0.1 +
            data['projects_count'][i] * 0.1 +
            data['internship_count'][i] * 0.1 +
            data['resume_score'][i] * 0.1 +
            data['interview_performance'][i] * 0.1
        ) / 100

        data['placed'] = (placed_score > 0.6).astype(int)

    data['failure_reasons'] = failure_reasons

    df = pd.DataFrame(data)
    return df

def preprocess_data(df):
    """Preprocess failure analysis data"""
    # Features for analysis
    features = ['cgpa', 'dsa_score', 'aptitude_score', 'communication_score',
                'projects_count', 'internship_count', 'resume_score',
                'interview_performance', 'leadership_score', 'consistency_score']

    X = df[features]
    y = df['placed']

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, scaler, features

def train_failure_model(X_train, X_test, y_train, y_test):
    """Train Random Forest for failure analysis"""
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"Failure Analysis Model - Accuracy: {accuracy:.4f}")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))

    return model

def analyze_failure_reasons(model, features, sample_data):
    """Analyze failure reasons using feature importance"""
    # Get feature importances
    importances = model.feature_importances_

    # Create importance dictionary
    importance_dict = dict(zip(features, importances))

    # Sort by importance
    sorted_importances = sorted(importance_dict.items(), key=lambda x: x[1], reverse=True)

    # Identify key failure reasons (low values in important features)
    failure_reasons = []

    for feature, importance in sorted_importances[:5]:  # Top 5 important features
        if feature in sample_data:
            value = sample_data[feature]

            # Define thresholds for each feature
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

            if feature in thresholds and value < thresholds[feature]:
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

                if feature in reason_mapping:
                    failure_reasons.append(reason_mapping[feature])

    return failure_reasons[:3]  # Return top 3 reasons

def main():
    # Generate data
    print("Generating synthetic failure analysis data...")
    df = generate_failure_data(1500)

    # Preprocess
    print("Preprocessing data...")
    X_scaled, y, scaler, features = preprocess_data(df)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    # Train model
    print("Training failure analysis model...")
    model = train_failure_model(X_train, X_test, y_train, y_test)

    # Save model and scaler
    print("Saving models...")
    joblib.dump(model, 'ml_models/failure_analysis/dt_model.joblib')
    joblib.dump(scaler, 'ml_models/failure_analysis/failure_scaler.joblib')
    joblib.dump(features, 'ml_models/failure_analysis/failure_features.joblib')

    print("Models saved successfully!")

    # Test inference
    print("Testing inference...")
    sample_student = {
        'cgpa': 6.5,
        'dsa_score': 45,
        'aptitude_score': 55,
        'communication_score': 40,
        'projects_count': 2,
        'internship_count': 0,
        'resume_score': 45,
        'interview_performance': 50,
        'leadership_score': 60,
        'consistency_score': 0.4
    }

    failure_reasons = analyze_failure_reasons(model, features, sample_student)
    print(f"Key failure reasons: {failure_reasons}")

if __name__ == "__main__":
    main()