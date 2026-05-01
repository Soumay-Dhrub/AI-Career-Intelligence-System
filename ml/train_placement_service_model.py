"""
Placement Service Model Training Script

This script trains the placement probability model that takes aggregated features
from all other services: consistency_score, resume_score, internship_score, etc.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
import os

# Create models directory if not exists
os.makedirs('ml_models/placement_engine', exist_ok=True)

def generate_aggregated_data(n_samples=2000):
    """Generate synthetic aggregated data matching the orchestrator expectations"""
    np.random.seed(42)

    data = {
        'consistency_score': np.random.uniform(0, 1, n_samples),
        'resume_score': np.random.uniform(0, 100, n_samples),
        'internship_score': np.random.uniform(0, 1, n_samples),
        'placement_boost': np.random.uniform(0, 1, n_samples),
        'burnout_risk_encoded': np.random.randint(0, 3, n_samples),  # 0=Low, 1=Medium, 2=High
        'avg_subject_score': np.random.uniform(0, 100, n_samples),
    }

    # Calculate placement probability based on aggregated features
    placement_prob = (
        data['consistency_score'] * 0.2 +
        data['resume_score'] * 0.002 +  # Scale down
        data['internship_score'] * 0.25 +
        data['placement_boost'] * 0.2 +
        (2 - data['burnout_risk_encoded']) * 0.1 +  # Lower risk = higher prob
        data['avg_subject_score'] * 0.003  # Scale down
    )

    # Add noise and clip
    placement_prob += np.random.normal(0, 0.1, n_samples)
    placement_prob = np.clip(placement_prob, 0, 1)

    data['placement_probability'] = placement_prob

    df = pd.DataFrame(data)
    return df

def preprocess_data(df):
    """Preprocess aggregated data"""
    features = ['consistency_score', 'resume_score', 'internship_score',
                'placement_boost', 'burnout_risk_encoded', 'avg_subject_score']

    X = df[features]
    y = df['placement_probability']

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, scaler, features

def train_placement_model(X_train, X_test, y_train, y_test):
    """Train Random Forest Regressor for final placement prediction"""
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"Placement Model - MSE: {mse:.4f}, R²: {r2:.4f}")

    return model

def get_risk_category(probability):
    """Convert probability to risk category"""
    if probability >= 0.7:
        return "Low"
    elif probability >= 0.4:
        return "Medium"
    else:
        return "High"

def main():
    # Generate data
    print("Generating synthetic aggregated placement data...")
    df = generate_aggregated_data(3000)

    # Preprocess
    print("Preprocessing data...")
    X_scaled, y, scaler, features = preprocess_data(df)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    # Train model
    print("Training placement probability model...")
    model = train_placement_model(X_train, X_test, y_train, y_test)

    # Save model and scaler (overwrite existing)
    print("Saving models...")
    joblib.dump(model, 'ml_models/placement_engine/placement_regressor.joblib')
    joblib.dump(scaler, 'ml_models/placement_engine/scaler.joblib')
    joblib.dump(features, 'ml_models/placement_engine/features.joblib')

    # Remove old classifier since we're not using it
    classifier_path = 'ml_models/placement_engine/placement_classifier.joblib'
    if os.path.exists(classifier_path):
        os.remove(classifier_path)

    print("Models saved successfully!")

    # Test inference
    print("Testing inference...")
    sample_input = {
        'consistency_score': 0.8,
        'resume_score': 75.0,
        'internship_score': 0.6,
        'placement_boost': 0.4,
        'burnout_risk_encoded': 1,  # Medium
        'avg_subject_score': 80.0
    }

    # Prepare input
    input_data = [[sample_input[feat] for feat in features]]
    input_scaled = scaler.transform(input_data)
    probability = model.predict(input_scaled)[0]
    risk = get_risk_category(probability)

    print(f"Sample prediction - Probability: {probability:.4f}, Risk: {risk}")

if __name__ == "__main__":
    main()