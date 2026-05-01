"""
Internship Impact Prediction Model Training Script

This script trains a regression model to predict internship impact on placement chances.
Model: Random Forest Regressor
Output: Impact score (0-1) on placement probability
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os

# Create models directory if not exists
os.makedirs('ml_models/internship', exist_ok=True)

def generate_internship_data(n_samples=1000):
    """Generate synthetic internship data"""
    np.random.seed(42)

    companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Startup', 'Local Company']
    domains = ['Software Development', 'Data Science', 'DevOps', 'Mobile Development', 'Web Development']
    durations = [1, 2, 3, 6, 12]  # months

    data = {
        'company': np.random.choice(companies, n_samples),
        'domain': np.random.choice(domains, n_samples),
        'duration_months': np.random.choice(durations, n_samples),
        'project_complexity': np.random.uniform(1, 10, n_samples),  # 1-10 scale
        'team_size': np.random.randint(1, 50, n_samples),
        'technologies_used': np.random.randint(1, 15, n_samples),  # Number of technologies
        'mentorship_quality': np.random.uniform(1, 10, n_samples),  # 1-10 scale
    }

    # Calculate impact score based on features
    company_tier = pd.Categorical(data['company'], categories=companies, ordered=True).codes + 1
    domain_relevance = np.random.uniform(0.5, 1.0, n_samples)  # Assume domains are relevant

    impact_score = (
        company_tier * 0.3 +
        data['duration_months'] * 0.2 +
        data['project_complexity'] * 0.15 +
        data['mentorship_quality'] * 0.15 +
        data['technologies_used'] * 0.1 +
        domain_relevance * 0.1
    ) / 10  # Normalize to 0-1

    # Add noise
    impact_score += np.random.normal(0, 0.1, n_samples)
    impact_score = np.clip(impact_score, 0, 1)

    data['impact_score'] = impact_score

    df = pd.DataFrame(data)
    return df

def preprocess_data(df):
    """Preprocess internship data"""
    # Encode categorical variables
    company_encoder = LabelEncoder()
    domain_encoder = LabelEncoder()

    df_encoded = df.copy()
    df_encoded['company_encoded'] = company_encoder.fit_transform(df['company'])
    df_encoded['domain_encoded'] = domain_encoder.fit_transform(df['domain'])

    # Features for training
    features = ['company_encoded', 'domain_encoded', 'duration_months', 'project_complexity',
                'team_size', 'technologies_used', 'mentorship_quality']

    X = df_encoded[features]
    y = df_encoded['impact_score']

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    return X_scaled, y, scaler, features, company_encoder, domain_encoder

def train_internship_model(X_train, X_test, y_train, y_test):
    """Train Random Forest Regressor for internship impact prediction"""
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"Internship Impact Model - MSE: {mse:.4f}, R²: {r2:.4f}")

    return model

def predict_internship_impact(model, scaler, features, company_encoder, domain_encoder, input_data):
    """Predict internship impact from input data"""
    # Encode categorical inputs
    input_encoded = input_data.copy()
    input_encoded['company_encoded'] = company_encoder.transform([input_data['company']])[0]
    input_encoded['domain_encoded'] = domain_encoder.transform([input_data['domain']])[0]

    # Prepare features
    X = [[input_encoded[feat] for feat in features]]
    X_scaled = scaler.transform(X)

    # Predict
    impact_score = model.predict(X_scaled)[0]

    return impact_score

def main():
    # Generate data
    print("Generating synthetic internship data...")
    df = generate_internship_data(1500)

    # Preprocess
    print("Preprocessing data...")
    X_scaled, y, scaler, features, company_encoder, domain_encoder = preprocess_data(df)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42
    )

    # Train model
    print("Training internship impact model...")
    model = train_internship_model(X_train, X_test, y_train, y_test)

    # Save models and encoders
    print("Saving models...")
    joblib.dump(model, 'ml_models/internship/rf_model.joblib')
    joblib.dump(scaler, 'ml_models/internship/internship_scaler.joblib')
    joblib.dump(features, 'ml_models/internship/internship_features.joblib')
    joblib.dump(company_encoder, 'ml_models/internship/company_encoder.joblib')
    joblib.dump(domain_encoder, 'ml_models/internship/domain_encoder.joblib')

    print("Models saved successfully!")

    # Test inference
    print("Testing inference...")
    sample_input = {
        'company': 'Google',
        'domain': 'Software Development',
        'duration_months': 6,
        'project_complexity': 8.0,
        'team_size': 10,
        'technologies_used': 5,
        'mentorship_quality': 9.0
    }

    impact = predict_internship_impact(model, scaler, features, company_encoder, domain_encoder, sample_input)
    print(f"Sample prediction - Internship Impact Score: {impact:.4f}")

if __name__ == "__main__":
    main()