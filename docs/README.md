# Placement Readiness System — Backend

## Setup

```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc:       http://localhost:8000/redoc

## Endpoints

### GET /health
```bash
curl http://localhost:8000/health
```

### POST /burnout
```bash
curl -X POST http://localhost:8000/burnout \
  -H "Content-Type: application/json" \
  -d '{"study_log": {"daily_hours": [4,5,3,6,4,5,4], "dates": ["2024-01-01","2024-01-02","2024-01-03","2024-01-04","2024-01-05","2024-01-06","2024-01-07"]}}'
```

### POST /resume
```bash
curl -X POST http://localhost:8000/resume \
  -H "Content-Type: application/json" \
  -d '{"resume_text": "Python developer with Django REST API experience", "job_description": "FastAPI Python developer with Docker and Kubernetes skills"}'
```

### POST /internship
```bash
curl -X POST http://localhost:8000/internship \
  -H "Content-Type: application/json" \
  -d '{"duration_months": 6, "company_tier": 2, "role_relevance": 0.8, "project_count": 3}'
```

### POST /failure
```bash
curl -X POST http://localhost:8000/failure \
  -H "Content-Type: application/json" \
  -d '{"performance": {"subject_scores": [{"subject": "Math", "score": 45}, {"subject": "CS", "score": 78}], "backlogs": 1, "project_failures": 0}}'
```

### POST /roadmap
```bash
curl -X POST http://localhost:8000/roadmap \
  -H "Content-Type: application/json" \
  -d '{"skill_gap": {"current_skills": ["Python", "Django"], "target_skills": ["FastAPI", "Docker", "Kubernetes"], "target_role": "Backend Engineer"}}'
```

### POST /analyze (full pipeline)
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d @docs/sample_request.json
```

## ML Models

Place trained model artifacts in the `ml_models/` directory:

| Model | Path |
|---|---|
| Burnout (Logistic Regression) | `ml_models/consistency/burnout_model.joblib` |
| Resume TF-IDF Vectorizer | `ml_models/resume_engine/tfidf_vectorizer.joblib` |
| Internship (Random Forest) | `ml_models/internship/rf_model.joblib` |
| Failure (Decision Tree) | `ml_models/failure_analysis/dt_model.joblib` |
| Roadmap (Collaborative Filter) | `ml_models/roadmap/cf_model.joblib` |
| Placement (XGBoost) | `ml_models/placement_engine/xgb_model.joblib` |

If any model file is missing, the service automatically falls back to rule-based logic — the server will still start and respond correctly.
