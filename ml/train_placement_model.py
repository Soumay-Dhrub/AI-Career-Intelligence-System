"""
Placement Probability Prediction Model Training Script

This script trains and evaluates models for predicting placement probability.
Models: Random Forest, XGBoost, Logistic Regression
Output: Placement probability (0-1) + risk category (High/Medium/Low)
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score
import joblib
import os

# Create models directory if not exists
os.makedirs('ml_models/placement_engine', exist_ok=True)

def generate_placement_data(n_samples=1000):
    """Generate synthetic placement data"""
    np.random.seed(42)

    data = {
        'cgpa': np.random.uniform(4.0, 10.0, n_samples),
        'dsa_score': np.random.uniform(0, 100, n_samples),
        'aptitude_score': np.random.uniform(0, 100, n_samples),
        'projects_count': np.random.randint(0, 20, n_samples),
        'internship_count': np.random.randint(0, 5, n_samples),
        'resume_score': np.random.uniform(0, 100, n_samples),
        'communication_score': np.random.uniform(0, 100, n_samples),
        'leadership_score': np.random.uniform(0, 100, n_samples),
    }

    # Calculate placement probability based on features
    placement_prob = (
        data['cgpa'] * 0.2 +
        data['dsa_score'] * 0.15 +
        data['aptitude_score'] * 0.15 +
        data['projects_count'] * 0.1 +
        data['internship_count'] * 0.15 +
        data['resume_score'] * 0.1 +
        data['communication_score'] * 0.08 +
        data['leadership_score'] * 0.07
    ) / 100

    # Add noise
    placement_prob += np.random.normal(0, 0.1, n_samples)
    placement_prob = np.clip(placement_prob, 0, 1)

    # Convert to binary for classification
    data['placed'] = (placement_prob > 0.5).astype(int)

    df = pd.DataFrame(data)
    df['placement_probability'] = placement_prob

    return df

def preprocess_data(df):
    """Preprocess the data"""
    # Features for training
    features = ['cgpa', 'dsa_score', 'aptitude_score', 'projects_count',
                'internship_count', 'resume_score', 'communication_score', 'leadership_score']

    X = df[features]
    y_class = df['placed']
    y_reg = df['placement_probability']

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y_class, y_reg, scaler, features

def train_classification_models(X_train, X_test, y_train, y_test):
    """Train and compare classification models"""
    models = {
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'Logistic Regression': LogisticRegression(random_state=42)
    }

    results = {}

    for name, model in models.items():
        # Train model
        model.fit(X_train, y_train)

        # Predictions
        y_pred = model.predict(X_test)

        # Metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)

        results[name] = {
            'model': model,
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1
        }

        print(f"{name} - Accuracy: {accuracy:.4f}, F1: {f1:.4f}")

    return results

def train_regression_model(X_train, X_test, y_train, y_test):
    """Train regression model for probability prediction"""
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"Regression Model - MSE: {mse:.4f}, R²: {r2:.4f}")

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
    print("Generating synthetic placement data...")
    df = generate_placement_data(2000)

    # Preprocess
    print("Preprocessing data...")
    X_scaled, y_class, y_reg, scaler, features = preprocess_data(df)

    # Split data
    X_train, X_test, y_class_train, y_class_test, y_reg_train, y_reg_test = train_test_split(
        X_scaled, y_class, y_reg, test_size=0.2, random_state=42
    )

    # Train classification models
    print("Training classification models...")
    class_results = train_classification_models(X_train, X_test, y_class_train, y_class_test)

    # Select best classification model (based on F1 score)
    best_class_model = max(class_results.items(), key=lambda x: x[1]['f1'])[1]['model']

    # Train regression model
    print("Training regression model...")
    reg_model = train_regression_model(X_train, X_test, y_reg_train, y_reg_test)

    # Save models and scaler
    print("Saving models...")
    joblib.dump(best_class_model, 'ml_models/placement_engine/placement_classifier.joblib')
    joblib.dump(reg_model, 'ml_models/placement_engine/placement_regressor.joblib')
    joblib.dump(scaler, 'ml_models/placement_engine/scaler.joblib')
    joblib.dump(features, 'ml_models/placement_engine/features.joblib')

    print("Models saved successfully!")

    # Test inference
    print("Testing inference...")
    sample_input = X_test[0:1]
    class_pred = best_class_model.predict(sample_input)[0]
    reg_pred = reg_model.predict(sample_input)[0]
    risk = get_risk_category(reg_pred)

    print(f"Sample prediction - Class: {class_pred}, Probability: {reg_pred:.4f}, Risk: {risk}")

if __name__ == "__main__":
    main()