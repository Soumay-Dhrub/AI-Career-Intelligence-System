# AI Career Intelligence System

A full-stack AI-powered platform that helps students evaluate and improve their job placement readiness through six specialized machine learning modules.

---

## Overview

PlaceReady combines a FastAPI backend with a React dashboard to give students a 360° view of their placement readiness. Each module analyzes a different dimension — study consistency, resume quality, internship experience, academic performance, skill gaps, and final placement probability — and aggregates them into a single actionable report.

---

## Features

- **Burnout & Consistency Analysis** — Detects burnout risk from study logs using time-series metrics and logistic regression
- **Resume Analyzer** — Scores resumes against job descriptions using TF-IDF + BERT semantic similarity
- **Internship Predictor** — Evaluates internship quality and estimates placement boost via Random Forest
- **Failure Analysis** — Identifies weak academic areas using a Decision Tree classifier
- **Roadmap Generator** — Produces a prioritized learning roadmap from skill gaps
- **Placement Predictor** — Aggregates all module outputs into a final probability score using XGBoost
- **Google OAuth** — Sign in with Google in addition to email/password
- **Dark / Light mode** — Persisted theme preference
- **Demo preview** — Dashboard shows sample data on first login so users understand the product immediately

---

## Architecture

```
placement-readiness/
├── backend/                  # FastAPI application
│   ├── main.py               # App factory, CORS, middleware, router registration
│   ├── core/
│   │   ├── config.py         # Pydantic settings (MODEL_DIR, LOG_LEVEL, etc.)
│   │   └── logging.py        # Structured JSON logger
│   ├── routes/               # One router per module + auth
│   │   ├── auth.py           # POST /auth/signup, /auth/login, /auth/google
│   │   ├── analyze.py        # POST /analyze  (full pipeline)
│   │   ├── burnout.py
│   │   ├── resume.py
│   │   ├── internship.py
│   │   ├── failure.py
│   │   ├── roadmap.py
│   │   └── health.py
│   ├── services/             # Business logic + ML inference
│   │   ├── model_registry.py # Loads all models at startup; fallback on missing files
│   │   ├── burnout_service.py
│   │   ├── resume_service.py
│   │   ├── internship_service.py
│   │   ├── failure_service.py
│   │   ├── roadmap_service.py
│   │   ├── placement_service.py
│   │   └── orchestrator_service.py
│   └── schemas/              # Pydantic request/response models
├── frontend/                 # React + Vite dashboard
│   ├── src/
│   │   ├── pages/            # Login, Signup, Dashboard, Analytics, Roadmap, Profile
│   │   │   └── modules/      # 6 standalone module pages
│   │   ├── components/
│   │   │   ├── layout/       # Navbar, Sidebar
│   │   │   ├── ui/           # MetricCard, SkillChip, RoadmapStep, Skeleton, Toast
│   │   │   ├── charts/       # Recharts wrappers
│   │   │   └── forms/        # LoginForm, SignupForm, AnalyzeModal
│   │   ├── stores/           # Zustand: authStore, analysisStore
│   │   ├── services/         # Axios API layer
│   │   ├── contexts/         # ThemeContext, ToastContext
│   │   ├── hooks/            # useTheme, useToast
│   │   ├── types/            # TypeScript interfaces
│   │   └── lib/              # utils, demoData
│   └── src/__tests__/        # Vitest unit + property-based tests
├── ml_models/                # Trained model artifacts (joblib)
│   ├── consistency/          # burnout_model.joblib
│   ├── resume_engine/        # tfidf_vectorizer.joblib
│   ├── internship/           # rf_model.joblib
│   ├── failure_analysis/     # dt_model.joblib
│   ├── roadmap/              # cf_model.joblib
│   └── placement_engine/     # xgb_model.joblib
├── data/
│   └── skills_vocab.json     # Technical skills vocabulary for resume analysis
└── docs/
    ├── sample_request.json
    └── sample_response.json
```

---

## Tech Stack

**Backend**
- Python 3.11+, FastAPI, Uvicorn
- scikit-learn, XGBoost, pandas, numpy
- sentence-transformers (BERT), joblib
- python-jose (JWT), passlib (bcrypt)
- httpx (Google OAuth token verification)

**Frontend**
- React 18, TypeScript, Vite
- Tailwind CSS, Framer Motion
- Zustand, React Router v6, Axios
- Recharts, react-hook-form + zod
- Vitest, fast-check (property-based tests)

---

## Setup

### Backend

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

### Google OAuth (optional)

1. Create a project at [Google Cloud Console](https://console.cloud.google.com/)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:5173` as an authorized JavaScript origin
4. Set the client ID in `frontend/.env`:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
5. Set the same value as an environment variable before starting the backend:
   ```bash
   export GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

### ML Models (optional)

Place trained model artifacts in the `ml_models/` directory. If any file is missing, the corresponding service automatically falls back to rule-based logic — the server starts and responds correctly without any models.

| Model | Path |
|---|---|
| Burnout (Logistic Regression) | `ml_models/consistency/burnout_model.joblib` |
| Resume TF-IDF Vectorizer | `ml_models/resume_engine/tfidf_vectorizer.joblib` |
| Internship (Random Forest) | `ml_models/internship/rf_model.joblib` |
| Failure (Decision Tree) | `ml_models/failure_analysis/dt_model.joblib` |
| Roadmap (Collaborative Filter) | `ml_models/roadmap/cf_model.joblib` |
| Placement (XGBoost) | `ml_models/placement_engine/xgb_model.joblib` |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/signup` | Register with email + password |
| `POST` | `/auth/login` | Login, returns JWT |
| `POST` | `/auth/google` | Login with Google ID token |
| `GET` | `/health` | Model registry status |
| `POST` | `/analyze` | Full pipeline — returns PlacementReport |
| `POST` | `/burnout` | Burnout & consistency analysis |
| `POST` | `/resume` | Resume scoring |
| `POST` | `/internship` | Internship impact scoring |
| `POST` | `/failure` | Failure pattern analysis |
| `POST` | `/roadmap` | Personalized roadmap generation |

See `docs/sample_request.json` and `docs/sample_response.json` for example payloads.

---

## Running Tests

**Backend (pytest)**
```bash
python -m pytest tests/ -q
```

**Frontend (Vitest)**
```bash
cd frontend
npm test
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET_KEY` | `your-secret-key-change-in-prod` | JWT signing secret — change in production |
| `GOOGLE_CLIENT_ID` | `""` | Google OAuth client ID |
| `VITE_API_BASE_URL` | `""` | Backend URL (empty = use Vite proxy) |
| `VITE_GOOGLE_CLIENT_ID` | `""` | Google OAuth client ID for frontend |
