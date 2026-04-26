"""
Behavioral & Learning Pattern Analysis Model Training Script

This script trains models for analyzing study patterns and burnout risk.
Tasks: Detect consistency, performance drops, burnout risk
Models: Random Forest for classification (burnout risk)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler
import joblib
import os

# Create models directory if not exists
os.makedirs('ml_models/consistency', exist_ok=True)

def generate_behavioral_data(n_samples=1000):
    """Generate synthetic behavioral data"""
    np.random.seed(42)

    data = []

    for _ in range(n_samples):
        # Generate 30 days of study hours
        base_hours = np.random.uniform(2, 8)  # Base daily hours
        consistency = np.random.uniform(0.3, 1.0)  # Consistency factor

        daily_hours = []
        for day in range(30):
            # Add some trend (burnout effect)
            burnout_factor = max(0, 1 - day * 0.02)
            hour = base_hours * consistency * burnout_factor + np.random.normal(0, 1)
            hour = max(0, min(12, hour))  # Clip to reasonable range
            daily_hours.append(hour)

        # Calculate features
        mean_hours = np.mean(daily_hours)
        std_hours = np.std(daily_hours)
        max_hours = np.max(daily_hours)
        min_hours = np.min(daily_hours)
        total_hours = np.sum(daily_hours)

        # Coefficient of variation (consistency measure)
        cv = std_hours / mean_hours if mean_hours > 0 else 1

        # Burnout risk based on features
        burnout_risk = 0
        if mean_hours < 3:
            burnout_risk += 0.3  # Low study hours
        if cv > 0.5:
            burnout_risk += 0.2  # Inconsistent
        if max_hours / mean_hours > 2:
            burnout_risk += 0.2  # High variability
        if np.array(daily_hours[-7:]).mean() < np.array(daily_hours[:7]).mean() * 0.7:
            burnout_risk += 0.3  # Recent decline

        burnout_risk = min(1, burnout_risk) + np.random.normal(0, 0.1)
        burnout_risk = np.clip(burnout_risk, 0, 1)

        # Convert to categories
        if burnout_risk < 0.33:
            risk_category = "Low"
        elif burnout_risk < 0.66:
            risk_category = "Medium"
        else:
            risk_category = "High"

        data.append({
            'daily_hours': daily_hours,
            'mean_hours': mean_hours,
            'std_hours': std_hours,
            'max_hours': max_hours,
            'min_hours': min_hours,
            'total_hours': total_hours,
            'coefficient_of_variation': cv,
            'burnout_risk': burnout_risk,
            'risk_category': risk_category
        })

    df = pd.DataFrame(data)
    return df

def preprocess_data(df):
    """Preprocess behavioral data for training"""
    # Features for burnout prediction
    features = ['mean_hours', 'std_hours', 'max_hours', 'min_hours',
                'total_hours', 'coefficient_of_variation']

    X = df[features]

    # Convert risk category to numeric
    risk_mapping = {'Low': 0, 'Medium': 1, 'High': 2}
    y = df['risk_category'].map(risk_mapping)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, scaler, features

def train_burnout_model(X_train, X_test, y_train, y_test):
    """Train Random Forest model for burnout risk prediction"""
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Predictions
    y_pred = model.predict(X_test)

    # Metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')

    print(f"Burnout Model - Accuracy: {accuracy:.4f}, F1: {f1:.4f}")

    return model

def calculate_consistency_score(daily_hours):
    """Calculate consistency score from daily hours"""
    hours = np.array(daily_hours)
    mean_h = np.mean(hours)
    std_h = np.std(hours)

    if mean_h == 0:
        return 0.0

    cv = std_h / mean_h
    consistency_score = float(np.clip(1.0 - cv, 0.0, 1.0))

    return consistency_score

def predict_burnout_risk(model, scaler, features, input_data):
    """Predict burnout risk from input data"""
    # Prepare input
    input_df = pd.DataFrame([input_data])
    X = input_df[features]
    X_scaled = scaler.transform(X)

    # Predict
    risk_numeric = model.predict(X_scaled)[0]

    # Convert back to category
    risk_mapping = {0: "Low", 1: "Medium", 2: "High"}
    risk_category = risk_mapping[risk_numeric]

    return risk_category

def main():
    # Generate data
    print("Generating synthetic behavioral data...")
    df = generate_behavioral_data(2000)

    # Preprocess
    print("Preprocessing data...")
    X_scaled, y, scaler, features = preprocess_data(df)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    # Train model
    print("Training burnout risk model...")
    model = train_burnout_model(X_train, X_test, y_train, y_test)

    # Save model and scaler
    print("Saving models...")
    joblib.dump(model, 'ml_models/consistency/burnout_model.joblib')
    joblib.dump(scaler, 'ml_models/consistency/behavioral_scaler.joblib')
    joblib.dump(features, 'ml_models/consistency/behavioral_features.joblib')

    print("Models saved successfully!")

    # Test inference
    print("Testing inference...")
    sample_data = {
        'mean_hours': 5.0,
        'std_hours': 1.5,
        'max_hours': 8.0,
        'min_hours': 2.0,
        'total_hours': 150.0,
        'coefficient_of_variation': 0.3
    }

    risk = predict_burnout_risk(model, scaler, features, sample_data)
    consistency = calculate_consistency_score([5, 6, 4, 5, 7, 5, 4])  # Sample daily hours

    print(f"Sample prediction - Burnout Risk: {risk}, Consistency Score: {consistency:.4f}")

if __name__ == "__main__":
    main()