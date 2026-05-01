"""ML integration services that connect database data with trained models."""
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import joblib
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.database.models import Student, Skills, Internship, Resume, BehavioralData, Prediction
from backend.database.data_processor import data_processor

logger = get_logger(__name__)


class MLIntegrationService:
    """Base class for ML model integration with database."""

    def __init__(self, model_name: str):
        self.model_name = model_name
        self.model = None
        self.scaler = None
        self.feature_names = None
        self._load_model()

    def _load_model(self):
        """Load trained model and preprocessing artifacts."""
        try:
            model_dir = settings.MODEL_DIR / self.model_name

            model_path = model_dir / f"{self.model_name}.joblib"
            scaler_path = model_dir / "scaler.joblib"
            features_path = model_dir / "features.joblib"

            if model_path.exists():
                self.model = joblib.load(model_path)
                logger.info(f"Loaded model: {self.model_name}")
            else:
                logger.warning(f"Model not found: {model_path}")

            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                logger.info(f"Loaded scaler for: {self.model_name}")

            if features_path.exists():
                self.feature_names = joblib.load(features_path)
                logger.info(f"Loaded features for: {self.model_name}")

        except Exception as e:
            logger.error(f"Failed to load model {self.model_name}: {e}")

    def _prepare_features(self, data: Dict[str, Any]) -> np.ndarray:
        """Prepare input features for model prediction."""
        if not self.feature_names:
            raise ValueError(f"Feature names not loaded for {self.model_name}")

        # Create feature vector in correct order
        features = []
        for feature in self.feature_names:
            if feature in data:
                features.append(data[feature])
            else:
                logger.warning(f"Missing feature: {feature}, using 0.0")
                features.append(0.0)

        features_array = np.array([features])

        # Scale features if scaler is available
        if self.scaler:
            features_array = self.scaler.transform(features_array)

        return features_array

    def predict(self, features: Dict[str, Any]) -> Any:
        """Make prediction using loaded model."""
        if not self.model:
            raise ValueError(f"Model {self.model_name} not loaded")

        try:
            input_features = self._prepare_features(features)
            prediction = self.model.predict(input_features)

            # Handle single output vs array output
            if isinstance(prediction, np.ndarray):
                if prediction.ndim > 1:
                    prediction = prediction.flatten()
                if len(prediction) == 1:
                    prediction = prediction[0]

            logger.info(f"Prediction made for {self.model_name}: {prediction}")
            return prediction

        except Exception as e:
            logger.error(f"Prediction failed for {self.model_name}: {e}")
            raise


class PlacementMLService(MLIntegrationService):
    """ML service for placement probability prediction."""

    def __init__(self):
        super().__init__("placement_engine")

    def predict_placement(self, db: Session, student_id: int) -> Tuple[float, str]:
        """Predict placement probability for a student."""
        # Fetch student data from database
        student_data = self._get_student_features(db, student_id)

        if not student_data:
            raise ValueError(f"No data found for student {student_id}")

        # Make prediction
        probability = self.predict(student_data)

        # Convert to risk level
        risk_level = self._probability_to_risk(probability)

        return probability, risk_level

    def _get_student_features(self, db: Session, student_id: int) -> Optional[Dict[str, Any]]:
        """Aggregate features from multiple tables for placement prediction."""
        # Get student basic info
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            return None

        features = {}

        # Get skills data
        skills = db.query(Skills).filter(Skills.student_id == student_id).first()
        if skills:
            features['dsa_score'] = skills.dsa_score or 0.0
            features['aptitude_score'] = skills.aptitude_score or 0.0
            features['communication_score'] = skills.communication_score or 0.0
            features['projects_count'] = skills.projects_count or 0

        # Get internship data (aggregate)
        internships = db.query(Internship).filter(Internship.student_id == student_id).all()
        if internships:
            avg_duration = np.mean([i.duration_months for i in internships])
            avg_tier = np.mean([i.company_tier for i in internships])
            avg_complexity = np.mean([i.project_complexity or 0.5 for i in internships])

            features['internship_score'] = avg_duration * 0.3 + (5 - avg_tier) * 0.4 + avg_complexity * 0.3
            features['placement_boost'] = features['internship_score'] / 10.0
        else:
            features['internship_score'] = 0.0
            features['placement_boost'] = 0.0

        # Get resume data
        resume = db.query(Resume).filter(Resume.student_id == student_id).first()
        if resume:
            features['resume_score'] = resume.resume_score or 0.0
        else:
            features['resume_score'] = 0.0

        # Get behavioral data (recent 30 days)
        behavioral_data = db.query(BehavioralData).filter(
            BehavioralData.student_id == student_id
        ).order_by(BehavioralData.date.desc()).limit(30).all()

        if behavioral_data:
            avg_hours = np.mean([b.study_hours for b in behavioral_data])
            consistency_scores = [b.consistency_score for b in behavioral_data if b.consistency_score]
            avg_consistency = np.mean(consistency_scores) if consistency_scores else 0.5

            features['consistency_score'] = avg_consistency
            features['burnout_risk_encoded'] = 1 if avg_consistency < 0.4 else (2 if avg_consistency < 0.7 else 0)
        else:
            features['consistency_score'] = 0.5
            features['burnout_risk_encoded'] = 1

        # Academic performance
        features['avg_subject_score'] = student.cgpa * 10 if student.cgpa else 50.0  # Convert CGPA to percentage

        return features

    def _probability_to_risk(self, probability: float) -> str:
        """Convert placement probability to risk level."""
        if probability < 0.4:
            return "High"
        elif probability <= 0.7:
            return "Medium"
        return "Low"


class BehavioralMLService(MLIntegrationService):
    """ML service for behavioral analysis."""

    def __init__(self):
        super().__init__("consistency")

    def analyze_behavior(self, db: Session, student_id: int) -> Dict[str, Any]:
        """Analyze student behavioral patterns."""
        # Get recent behavioral data
        behavioral_data = db.query(BehavioralData).filter(
            BehavioralData.student_id == student_id
        ).order_by(BehavioralData.date.desc()).limit(30).all()

        if not behavioral_data:
            return {"burnout_risk": "Unknown", "consistency_score": 0.0}

        # Prepare features for model
        features = self._prepare_behavioral_features(behavioral_data)

        # Make prediction
        burnout_prediction = self.predict(features)

        # Convert prediction to risk level
        risk_mapping = {0: "Low", 1: "Medium", 2: "High"}
        burnout_risk = risk_mapping.get(int(burnout_prediction), "Unknown")

        return {
            "burnout_risk": burnout_risk,
            "consistency_score": features.get("consistency_score", 0.0)
        }

    def _prepare_behavioral_features(self, behavioral_data: List[BehavioralData]) -> Dict[str, Any]:
        """Prepare features from behavioral data."""
        hours = [b.study_hours for b in behavioral_data]
        consistency_scores = [b.consistency_score for b in behavioral_data if b.consistency_score]

        return {
            "mean_hours": np.mean(hours) if hours else 0.0,
            "std_hours": np.std(hours) if len(hours) > 1 else 0.0,
            "max_hours": np.max(hours) if hours else 0.0,
            "min_hours": np.min(hours) if hours else 0.0,
            "consistency_score": np.mean(consistency_scores) if consistency_scores else 0.5
        }


class InternshipMLService(MLIntegrationService):
    """ML service for internship impact analysis."""

    def __init__(self):
        super().__init__("internship")

    def analyze_internship_impact(self, db: Session, student_id: int) -> Dict[str, Any]:
        """Analyze internship impact on placement."""
        internships = db.query(Internship).filter(Internship.student_id == student_id).all()

        if not internships:
            return {"internship_score": 0.0, "placement_boost": 0.0}

        # Aggregate internship features
        features = self._aggregate_internship_features(internships)

        # Make prediction
        internship_score = self.predict(features)

        return {
            "internship_score": float(internship_score),
            "placement_boost": float(internship_score) / 10.0  # Normalize to 0-1
        }

    def _aggregate_internship_features(self, internships: List[Internship]) -> Dict[str, Any]:
        """Aggregate features from multiple internships."""
        durations = [i.duration_months for i in internships]
        tiers = [i.company_tier for i in internships]
        complexities = [i.project_complexity or 0.5 for i in internships]

        return {
            "duration_months": np.mean(durations),
            "company_tier": np.mean(tiers),
            "role_relevance": 0.8,  # Default relevance (could be enhanced)
            "project_count": len(internships)
        }


class ResumeMLService:
    """ML service for resume analysis using TF-IDF."""

    def __init__(self):
        self.vectorizer = None
        self._load_vectorizer()

    def _load_vectorizer(self):
        """Load TF-IDF vectorizer."""
        try:
            vectorizer_path = settings.MODEL_DIR / "resume_engine" / "tfidf_vectorizer.joblib"
            if vectorizer_path.exists():
                self.vectorizer = joblib.load(vectorizer_path)
                logger.info("Loaded TF-IDF vectorizer")
            else:
                logger.warning("TF-IDF vectorizer not found")
        except Exception as e:
            logger.error(f"Failed to load TF-IDF vectorizer: {e}")

    def analyze_resume(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """Analyze resume against job description."""
        if not self.vectorizer:
            return {"resume_score": 0.0, "missing_skills": []}

        try:
            # Vectorize texts
            vectors = self.vectorizer.transform([resume_text, job_description])

            # Calculate similarity
            from sklearn.metrics.pairwise import cosine_similarity
            similarity = cosine_similarity(vectors[0], vectors[1])[0][0]

            # Extract skills (simplified)
            resume_skills = self._extract_skills(resume_text)
            job_skills = self._extract_skills(job_description)
            missing_skills = list(set(job_skills) - set(resume_skills))

            return {
                "resume_score": float(similarity),
                "missing_skills": missing_skills
            }

        except Exception as e:
            logger.error(f"Resume analysis failed: {e}")
            return {"resume_score": 0.0, "missing_skills": []}

    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from text (simplified version)."""
        # Load skills vocabulary
        skills_vocab = []
        vocab_path = settings.SKILLS_VOCAB_PATH
        if vocab_path.exists():
            try:
                import json
                with open(vocab_path, 'r') as f:
                    skills_vocab = json.load(f)
            except:
                pass

        text_lower = text.lower()
        found_skills = [skill for skill in skills_vocab if skill.lower() in text_lower]

        return found_skills


# Global service instances
placement_ml_service = PlacementMLService()
behavioral_ml_service = BehavioralMLService()
internship_ml_service = InternshipMLService()
resume_ml_service = ResumeMLService()