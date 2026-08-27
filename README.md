# AI Career Intelligence System

A polished, full-stack platform that helps students improve job placement readiness by combining AI-driven analytics, resume intelligence, and personalized learning roadmaps.

---

## What this project demonstrates

- End-to-end **full-stack development** with a production-style backend and a modern frontend.
- Practical **machine learning engineering** with trained models, serialized artifacts, and inference pipelines.
- Secure authentication, API design, and frontend state management for real application workflows.
- Strong developer experience with clear documentation, modular architecture, and reusable components.

## Highlights

- **User-focused product**: Builds data-driven guidance that students can act on immediately.
- **Technical breadth**: Covers backend API design, frontend UX, ML model integration, and deployment-ready structure.
- **Professional quality**: Uses modern framework versions, environment configuration, and documented setup.
- **Scalable design**: Separates business logic, routing, models, and UI into maintainable layers.

## What the platform does

- **Resume Analysis** — compares resumes against job requirements and highlights missing skills.
- **Burnout & Consistency** — analyzes study activity to identify risk patterns.
- **Internship Impact** — evaluates internship experience for placement improvement.
- **Failure Analysis** — surfaces academic and skill deficits that affect readiness.
- **Roadmap Generation** — builds a personalized development plan for skills growth.
- **Placement Prediction** — combines insights into an overall chance of success.

## Feature benefits

| Feature | Benefit | Why it matters |
|---|---|---|
| FastAPI backend | Fast, async, clean API | Supports real production workloads and standard API docs |
| React + TypeScript frontend | Strong UX with type safety | Easy to maintain and extend for future features |
| ML model pipeline | Real data-driven recommendations | Demonstrates practical AI integration, not just static UI |
| JWT + OAuth auth | Secure user flow | Reflects professional security practices |
| Modular architecture | Clear separation of concerns | Simplifies teamwork and feature delivery |

## Tech stack

### Backend
- Python 3.11+
- FastAPI 0.135
- Pydantic 2
- scikit-learn, XGBoost
- SQLAlchemy / Supabase-compatible patterns

### Frontend
- React 18
- TypeScript 5
- Vite
- Tailwind CSS
- Zustand state management

## Repository structure

- `backend/` — FastAPI app, business logic, routes, schemas, DB integration
- `frontend/` — React dashboard, pages, services, UI components
- `ml/` — model training and inference scripts
- `ml_models/` — serialized model artifacts
- `data/` — vocabularies and datasets
- `tests/` — automated tests
- `docs/` — API and setup documentation

## Quick start

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm 9+ or yarn

### Run locally

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

### Access the app

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Environment variables

Copy `.env.example` to `.env` and update as needed.

Important values:
- `SECRET_KEY` — JWT signing key
- `GOOGLE_CLIENT_ID` — Google OAuth client ID (optional)
- `MODEL_DIR` — model artifact folder
- `SKILLS_VOCAB_PATH` — skills vocabulary path

## API overview

### Authentication
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/google`

### Analysis endpoints
- `POST /analyze`
- `POST /resume`
- `POST /burnout`
- `POST /internship`
- `POST /failure`
- `POST /roadmap`
- `GET /health`

## Notes for reviewers

- The backend separates domain logic from route handling for easier testing and maintenance.
- The frontend uses reusable UI patterns, making new pages or features simple to add.
- The ML model layer is designed to support adding new predictive modules without changing core API behavior.

## License

MIT License
