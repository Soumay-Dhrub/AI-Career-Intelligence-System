"""Data processing pipeline for ML model training and inference."""
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib

from backend.core.config import settings
from backend.core.logging import get_logger

logger = get_logger(__name__)


class DataProcessor:
    """Handles data loading, cleaning, preprocessing, and feature engineering."""

    def __init__(self):
        self.scalers: Dict[str, StandardScaler] = {}
        self.encoders: Dict[str, LabelEncoder] = {}
        self.processed_data_dir = settings.PROCESSED_DATA_DIR
        self.processed_data_dir.mkdir(parents=True, exist_ok=True)

    def load_csv_data(self, file_path: Path) -> pd.DataFrame:
        """Load data from CSV file with error handling."""
        try:
            df = pd.read_csv(file_path)
            logger.info(f"Loaded {len(df)} rows from {file_path}")
            return df
        except Exception as e:
            logger.error(f"Failed to load data from {file_path}: {e}")
            raise

    def load_from_database(self, db_session, table_name: str, columns: List[str] = None) -> pd.DataFrame:
        """Load data from database table."""
        try:
            from backend.database.models import Student, Skills, Internship, Resume, BehavioralData, Prediction

            table_map = {
                'students': Student,
                'skills': Skills,
                'internships': Internship,
                'resumes': Resume,
                'behavioral_data': BehavioralData,
                'predictions': Prediction,
            }

            if table_name not in table_map:
                raise ValueError(f"Unknown table: {table_name}")

            model = table_map[table_name]
            query = db_session.query(model)

            if columns:
                query = query.with_entities(*[getattr(model, col) for col in columns])

            df = pd.read_sql(query.statement, db_session.bind)
            logger.info(f"Loaded {len(df)} rows from {table_name} table")
            return df

        except Exception as e:
            logger.error(f"Failed to load data from {table_name}: {e}")
            raise

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and preprocess the data."""
        # Remove duplicates
        df = df.drop_duplicates()

        # Handle missing values
        df = self._handle_missing_values(df)

        # Remove outliers (using IQR method for numerical columns)
        df = self._remove_outliers(df)

        # Standardize column names
        df.columns = df.columns.str.lower().str.replace(' ', '_')

        logger.info(f"Data cleaned: {len(df)} rows remaining")
        return df

    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the dataset."""
        # For numerical columns, fill with median
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols:
            if df[col].isnull().sum() > 0:
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)
                logger.info(f"Filled missing values in {col} with median: {median_val}")

        # For categorical columns, fill with mode
        categorical_cols = df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if df[col].isnull().sum() > 0:
                mode_val = df[col].mode().iloc[0] if not df[col].mode().empty else 'Unknown'
                df[col] = df[col].fillna(mode_val)
                logger.info(f"Filled missing values in {col} with mode: {mode_val}")

        return df

    def _remove_outliers(self, df: pd.DataFrame, threshold: float = 1.5) -> pd.DataFrame:
        """Remove outliers using IQR method."""
        numerical_cols = df.select_dtypes(include=[np.number]).columns

        for col in numerical_cols:
            if col in ['id', 'student_id']:  # Skip ID columns
                continue

            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1

            lower_bound = Q1 - threshold * IQR
            upper_bound = Q3 + threshold * IQR

            outliers = ((df[col] < lower_bound) | (df[col] > upper_bound))
            if outliers.sum() > 0:
                df = df[~outliers]
                logger.info(f"Removed {outliers.sum()} outliers from {col}")

        return df

    def encode_categorical_features(self, df: pd.DataFrame, categorical_cols: List[str]) -> pd.DataFrame:
        """Encode categorical features using LabelEncoder."""
        df_encoded = df.copy()

        for col in categorical_cols:
            if col in df_encoded.columns:
                encoder_key = f"{col}_encoder"
                if encoder_key not in self.encoders:
                    self.encoders[encoder_key] = LabelEncoder()

                df_encoded[col] = self.encoders[encoder_key].fit_transform(df_encoded[col].astype(str))
                logger.info(f"Encoded categorical column: {col}")

        return df_encoded

    def scale_numerical_features(self, df: pd.DataFrame, numerical_cols: List[str], scaler_name: str) -> pd.DataFrame:
        """Scale numerical features using StandardScaler."""
        df_scaled = df.copy()

        if scaler_name not in self.scalers:
            self.scalers[scaler_name] = StandardScaler()

        if numerical_cols:
            existing_cols = [col for col in numerical_cols if col in df_scaled.columns]
            if existing_cols:
                scaled_data = self.scalers[scaler_name].fit_transform(df_scaled[existing_cols])
                df_scaled[existing_cols] = scaled_data
                logger.info(f"Scaled numerical columns: {existing_cols}")

        return df_scaled

    def create_features_for_model(self, df: pd.DataFrame, model_type: str) -> pd.DataFrame:
        """Create specific features for different ML models."""
        if model_type == 'placement':
            # Aggregate features for placement prediction
            df = self._create_placement_features(df)
        elif model_type == 'behavioral':
            # Create behavioral analysis features
            df = self._create_behavioral_features(df)
        elif model_type == 'internship':
            # Create internship impact features
            df = self._create_internship_features(df)

        return df

    def _create_placement_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create aggregated features for placement prediction."""
        # This would typically aggregate data from multiple tables
        # For now, return the dataframe as-is (assuming it's already aggregated)
        required_cols = ['consistency_score', 'resume_score', 'internship_score',
                        'placement_boost', 'burnout_risk_encoded', 'avg_subject_score']

        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            logger.warning(f"Missing columns for placement features: {missing_cols}")

        return df

    def _create_behavioral_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create features for behavioral analysis."""
        if 'study_hours' in df.columns:
            # Calculate rolling averages and consistency metrics
            df['study_hours_ma7'] = df['study_hours'].rolling(window=7, min_periods=1).mean()
            df['study_hours_std7'] = df['study_hours'].rolling(window=7, min_periods=1).std()
            df['consistency_ratio'] = df['study_hours_std7'] / (df['study_hours_ma7'] + 1e-6)

        return df

    def _create_internship_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create features for internship impact analysis."""
        # Calculate internship quality score
        if all(col in df.columns for col in ['duration_months', 'company_tier', 'project_complexity']):
            df['internship_quality'] = (
                df['duration_months'] * 0.3 +
                (5 - df['company_tier']) * 0.4 +  # Higher tier = better score
                df['project_complexity'] * 0.3
            )

        return df

    def split_train_test(self, df: pd.DataFrame, target_col: str, test_size: float = 0.2,
                        random_state: int = 42) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """Split data into training and testing sets."""
        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in dataframe")

        X = df.drop(columns=[target_col])
        y = df[target_col]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y if y.nunique() < 10 else None
        )

        logger.info(f"Data split: {len(X_train)} train, {len(X_test)} test samples")
        return X_train, X_test, y_train, y_test

    def save_processed_data(self, df: pd.DataFrame, filename: str):
        """Save processed data to disk."""
        filepath = self.processed_data_dir / f"{filename}.csv"
        df.to_csv(filepath, index=False)
        logger.info(f"Saved processed data to {filepath}")

    def save_scalers_and_encoders(self, model_name: str):
        """Save fitted scalers and encoders."""
        model_dir = self.processed_data_dir / model_name
        model_dir.mkdir(exist_ok=True)

        for name, scaler in self.scalers.items():
            joblib.dump(scaler, model_dir / f"{name}.joblib")

        for name, encoder in self.encoders.items():
            joblib.dump(encoder, model_dir / f"{name}.joblib")

        logger.info(f"Saved scalers and encoders for {model_name}")

    def load_scalers_and_encoders(self, model_name: str):
        """Load saved scalers and encoders."""
        model_dir = self.processed_data_dir / model_name

        if model_dir.exists():
            for file in model_dir.glob("*.joblib"):
                name = file.stem
                if name.endswith("_scaler"):
                    self.scalers[name] = joblib.load(file)
                elif name.endswith("_encoder"):
                    self.encoders[name] = joblib.load(file)

            logger.info(f"Loaded scalers and encoders for {model_name}")


# Global data processor instance
data_processor = DataProcessor()