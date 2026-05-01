# AI Career Intelligence System

> **A comprehensive, full-stack AI-powered platform for assessing and improving job placement readiness through six specialized machine learning modules.**

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](#)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#%EF%B8%8F-system-architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#-quick-start)
- [Setup Guide](#setup)
- [API Documentation](#api-endpoints)
- [Development](#-development-workflow)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

The AI Career Intelligence System combines a robust FastAPI backend with a modern React TypeScript dashboard to provide students with a holistic 360° assessment of their placement readiness. The system analyzes six critical career dimensions—study consistency, resume quality, internship experience, academic performance, skill gaps, and overall placement probability—and aggregates insights into actionable, personalized recommendations.

**Key strengths:**
- **Multi-dimensional analysis** — Six independent ML modules, each optimized for its domain
- **Production-ready** — Structured logging, error handling, graceful fallbacks
- **Extensible architecture** — Easy to add new modules or retrain models
- **Full-stack integration** — Seamless data flow from backend analytics to interactive frontend

---

## ✨ Features

### Core Analytics Modules
- **Burnout & Study Consistency** — Detects burnout risk and analyzes study patterns using time-series metrics (Logistic Regression)
- **Resume Analysis** — Scores resumes against job descriptions using TF-IDF vectorization + BERT semantic similarity
- **Internship Impact Predictor** — Evaluates internship quality and estimates placement boost (Random Forest)
- **Failure Pattern Analysis** — Identifies weak academic areas and knowledge gaps (Decision Tree)
- **Personalized Roadmap Generator** — Creates prioritized learning paths based on skill gaps (Collaborative Filtering)
- **Placement Probability Predictor** — Aggregates all module outputs into a final placement probability (XGBoost)

### Platform Features
- **Google OAuth 2.0 Integration** — Sign in securely with Google or email/password
- **Dark/Light Mode** — Persisted user theme preference
- **Demo Data Preview** — Dashboard shows sample analytics on first login for product understanding
- **Responsive Design** — Fully responsive interface optimized for desktop and tablet

---

## 🏗️ System Architecture

```
backend/
├── main.py                    # FastAPI app factory, middleware, router registration
├── core/
│   ├── config.py              # Pydantic Settings (MODEL_DIR, LOG_LEVEL, etc.)
│   ├── logging.py             # Structured JSON logging
│   └── supabase.py            # Database client initialization
├── routes/                    # HTTP endpoint handlers (one per module)
│   ├── auth.py                # Authentication (signup, login, Google OAuth)
│   ├── analyze.py             # Full pipeline orchestration
│   ├── burnout.py             # Burnout analysis endpoint
│   ├── resume.py              # Resume scoring endpoint
│   ├── internship.py          # Internship prediction endpoint
│   ├── failure.py             # Failure analysis endpoint
│   ├── roadmap.py             # Roadmap generation endpoint
│   └── health.py              # System health checks
├── services/                  # Business logic and ML inference
│   ├── model_registry.py      # Central model loader (startup + lazy loading)
│   ├── burnout_service.py     # Burnout analysis logic
│   ├── resume_service.py      # Resume scoring logic
│   ├── internship_service.py  # Internship prediction logic
│   ├── failure_service.py     # Failure analysis logic
│   ├── roadmap_service.py     # Roadmap generation logic
│   ├── placement_service.py   # Placement probability logic
│   ├── orchestrator_service.py # Pipeline coordination
│   └── auth_service.py        # Authentication logic
├── schemas/                   # Pydantic request/response models
│   ├── api.py                 # Common schemas
│   ├── burnout.py             # Burnout request/response
│   ├── resume.py              # Resume request/response
│   ├── internship.py          # Internship request/response
│   └── ... (other schemas)
└── database/                  # Data access layer (optional)
    ├── connection.py          # Database connection pool
    └── models.py              # SQLAlchemy ORM models (if using DB)

frontend/
├── src/
│   ├── pages/                 # Full-page components (routes)
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── modules/           # One page per analysis module
│   ├── components/
│   │   ├── layout/            # App shell: Navbar, Sidebar, AppLayout
│   │   ├── ui/                # Reusable UI: Card, Button, Modal, etc.
│   │   ├── charts/            # Recharts wrappers for visualizations
│   │   └── forms/             # Form components
│   ├── stores/                # Zustand state management
│   │   ├── authStore.ts       # Authentication state
│   │   └── analysisStore.ts   # Analysis results state
│   ├── services/              # API client functions
│   │   └── api.ts             # HTTP requests to backend
│   ├── hooks/                 # Custom React hooks
│   ├── contexts/              # React Context (theme, notifications)
│   ├── types/                 # TypeScript interfaces
│   └── lib/                   # Utilities and helpers

ml_models/                     # Trained model artifacts
├── consistency/               # Burnout model
├── resume_engine/             # Resume vectorizer
├── internship/                # Internship model
├── failure_analysis/          # Failure detection model
├── roadmap/                   # Roadmap generation model
└── placement_engine/          # Final placement prediction model

data/
└── skills_vocab.json          # Technical skills vocabulary

docs/
├── sample_request.json        # Example API request
└── sample_response.json       # Example API response

tests/
├── unit/                      # Unit tests (backend)
└── property/                  # Property-based tests (frontend)
```

### Communication Flow

1. **Frontend** sends HTTP request (React → Axios)
2. **Backend Route** receives request and validates input schema (Pydantic)
3. **Service Layer** executes business logic and ML inference
4. **ModelRegistry** provides pre-loaded models (hot swap, graceful fallback)
5. **Response** is serialized and returned to frontend
6. **Frontend** updates Zustand state and re-renders

---

## Tech Stack

### Backend Stack
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | FastAPI | 0.100+ | High-performance async web framework |
| **Runtime** | Python | 3.11+ | Core language |
| **ML Libraries** | scikit-learn, XGBoost | Latest | Machine learning models |
| **NLP** | sentence-transformers (BERT) | Latest | Semantic text analysis |
| **Auth** | python-jose, passlib | Latest | JWT + bcrypt security |
| **HTTP Client** | httpx | Latest | Async HTTP requests |
| **Data Processing** | pandas, numpy | Latest | Data manipulation |
| **Model Serialization** | joblib | Latest | ML model persistence |

### Frontend Stack
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 18+ | UI component library |
| **Language** | TypeScript | 5.0+ | Type-safe JavaScript |
| **Build Tool** | Vite | 5.0+ | Fast bundling & dev server |
| **Styling** | Tailwind CSS | 3.0+ | Utility-first CSS |
| **Animations** | Framer Motion | Latest | Smooth UI transitions |
| **State Management** | Zustand | Latest | Lightweight global state |
| **Routing** | React Router | 6+ | Client-side navigation |
| **HTTP Client** | Axios | Latest | API requests |
| **Charts** | Recharts | Latest | Data visualization |
| **Forms** | react-hook-form + Zod | Latest | Form validation |
| **Testing** | Vitest | Latest | Unit testing framework |

---

## 🚀 Quick Start

### For Impatient Developers

```bash
# Clone and setup
git clone <repo-url> && cd AI-Career-Intelligence-System
cp .env.example .env

# Backend (Terminal 1)
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload

# Frontend (Terminal 2)
cd frontend && npm install && npm run dev

# Access
# Backend:  http://localhost:8000 (docs at /docs)
# Frontend: http://localhost:5173
```

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

## 📡 API Endpoints

### Authentication Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/auth/signup` | Register a new user (email + password) | ❌ No |
| `POST` | `/auth/login` | Authenticate with email + password, returns JWT | ❌ No |
| `POST` | `/auth/google` | OAuth login with Google ID token | ❌ No |

### Analysis Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/analyze` | Run full pipeline analysis and return aggregated report | ✅ Yes |
| `POST` | `/burnout` | Analyze study consistency and burnout risk | ✅ Yes |
| `POST` | `/resume` | Score resume against job description | ✅ Yes |
| `POST` | `/internship` | Evaluate internship quality and impact | ✅ Yes |
| `POST` | `/failure` | Analyze failure patterns and weak areas | ✅ Yes |
| `POST` | `/roadmap` | Generate personalized learning roadmap | ✅ Yes |

### System Routes
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `GET` | `/health` | Check model registry status and dependencies | ❌ No |

**Base URL:** `http://localhost:8000` (development) or your production domain

**Response Format:** All endpoints return JSON with `status`, `data`, and optional `error` fields

**Example Request:**
```bash
curl -X POST http://localhost:8000/resume/analyze \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"resume_text": "...", "job_title": "Senior Software Engineer"}'
```

See [docs/sample_request.json](docs/sample_request.json) and [docs/sample_response.json](docs/sample_response.json) for detailed examples.

---

## Running Tests

### Backend Tests (pytest)

```bash
# Run all tests
python -m pytest tests/ -v

# Run with coverage report
python -m pytest tests/ --cov=backend --cov-report=html

# Run specific test file
python -m pytest tests/unit/test_resume_service.py -v

# Run tests matching pattern
python -m pytest tests/ -k "resume" -v
```

### Frontend Tests (Vitest)

```bash
cd frontend

# Run tests once
npm test

# Watch mode (re-run on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Testing Best Practices
- ✅ Write tests for all new features
- ✅ Aim for >80% code coverage
- ✅ Test edge cases and error conditions
- ✅ Use descriptive test names
- ✅ Run tests before committing

---

## Environment Variables

### Required Variables
```env
# JWT Authentication
JWT_SECRET_KEY=your-secret-key-here-change-in-production

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Optional Variables (with Defaults)
```env
# Logging
LOG_LEVEL=INFO                    # DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_FORMAT=json                   # json or text

# Model Configuration
MODEL_DIR=ml_models               # Path to ML models directory
SKILLS_VOCAB_PATH=data/skills_vocab.json

# Access Token Expiry
ACCESS_TOKEN_EXPIRE_MINUTES=10080 # 7 days by default
```

### Configuration Reference

| Variable | Type | Default | Production Value | Description |
|----------|------|---------|------------------|-------------|
| `JWT_SECRET_KEY` | String | `change-me-in-production` | Generate strong random key | Secret for signing JWTs |
| `GOOGLE_CLIENT_ID` | String | `""` | Your Google OAuth ID | OAuth 2.0 client identifier |
| `VITE_API_BASE_URL` | String | `""` | Your API domain | Backend URL (empty = proxy) |
| `LOG_LEVEL` | String | `INFO` | `WARNING` | Logging verbosity level |
| `MODEL_DIR` | Path | `ml_models` | `/opt/ml_models` | ML models storage path |

**Setup Instructions:**
```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env

# Load environment (bash/zsh)
export $(grep -v '^#' .env | xargs)
```

---

## 🔧 Development Workflow

## 🔧 Development Workflow

### Local Development Environment

**Prerequisites:**
- Python 3.11+
- Node.js 18+ (with npm or yarn)
- Git
- Virtual Environment (recommended: venv, Poetry, or Conda)

### Step-by-Step Setup

#### 1. Clone Repository

```bash
git clone https://github.com/your-username/AI-Career-Intelligence-System.git
cd AI-Career-Intelligence-System
```

#### 2. Prepare Environment

```bash
# Copy environment template
cp .env.example .env

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Verify Python version
python --version  # Should be 3.11+
```

#### 3. Backend Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi; print(f'FastAPI {fastapi.__version__}')"

# Start development server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Backend is ready at: **http://localhost:8000**
- Interactive API docs: **http://localhost:8000/docs**
- ReDoc: **http://localhost:8000/redoc**

#### 4. Frontend Setup (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend is ready at: **http://localhost:5173**

### Code Quality Standards

**Python Backend:**
- ✅ Follow [PEP 8](https://pep8.org/) style guide
- ✅ Use type hints for all functions: `def func(x: int) -> str:`
- ✅ Maximum line length: 100 characters
- ✅ Use docstrings for modules, classes, and functions
- ✅ Run linter: `pylint backend/ --disable=C0111`

**TypeScript/React Frontend:**
- ✅ Use strict TypeScript mode
- ✅ Define interfaces for all props: `interface Props { ... }`
- ✅ Use functional components with hooks only
- ✅ Keep components under 300 lines
- ✅ Use absolute imports with `@/` alias

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

<body>

<footer>
```

**Types:** `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `chore`

**Examples:**
```
feat(resume): add TF-IDF vectorizer caching
fix(auth): handle Google token expiration gracefully
docs(readme): update setup instructions
refactor(services): extract common ML logic to base class
```

### Useful Development Commands

```bash
# Backend
python -m pytest tests/ -v                    # Run tests
python -m pytest tests/ --cov=backend --cov-report=html  # Coverage
pylint backend/ --disable=C0111               # Lint code

# Frontend
npm run build                                 # Production build
npm run lint                                  # Check code style
npm run type-check                           # TypeScript check
npm run test:coverage                        # Coverage report

# Both
git status                                   # Check changes
git diff backend/main.py                     # View specific changes
```

---

## 📊 Performance & Optimization

### Backend Optimizations

| Technique | Implementation | Benefit |
|-----------|----------------|---------|
| **Model Caching** | Load models once at startup via ModelRegistry | Reduces inference latency by ~60% |
| **Vector Caching** | Cache TF-IDF vectorizer results | Avoids recomputation for similar resumes |
| **Lazy Loading** | Routes register on-demand | Faster app startup |
| **Connection Pooling** | Database connection reuse | Better resource utilization |
| **Async/Await** | FastAPI native async support | Handle concurrent requests efficiently |

### Frontend Optimizations

| Technique | Implementation | Benefit |
|-----------|----------------|---------|
| **Code Splitting** | Lazy-load route components | Smaller initial bundle (~45KB) |
| **Memoization** | React.memo for expensive components | Prevent unnecessary re-renders |
| **Tree Shaking** | Vite + ES6 modules | Eliminate unused code |
| **Image Optimization** | Serve responsive images | Faster load times |
| **State Deduplication** | Zustand with derived state | Minimal re-renders |

### Monitoring Performance

```bash
# Backend performance
python -m cProfile -s cumtime -m uvicorn backend.main:app

# Frontend bundle analysis
cd frontend && npm run build && npx vite-bundle-visualizer

# Load testing
pip install locust
locust -f locustfile.py --host=http://localhost:8000
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Update `JWT_SECRET_KEY` in production environment
- [ ] Set proper `LOG_LEVEL` (INFO or WARNING)
- [ ] Configure CORS for actual domain
- [ ] Use a production database (migrate from in-memory store)
- [ ] Set up proper SSL/HTTPS certificates
- [ ] Configure monitoring and logging aggregation
- [ ] Test model loading with production models
- [ ] Set environment variables securely

### Docker Deployment (Optional)

```bash
# Backend
docker build -t placement-readiness-backend ./backend
docker run -p 8000:8000 -e JWT_SECRET_KEY=<key> placement-readiness-backend

# Frontend
docker build -t placement-readiness-frontend ./frontend
docker run -p 3000:3000 placement-readiness-frontend
```

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
# Kill existing process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use a different port
uvicorn backend.main:app --port 8001
```

**Module not found errors:**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`
- Check Python path includes project root

**Google OAuth not working:**
- Verify `GOOGLE_CLIENT_ID` environment variable is set
- Check authorized origins in Google Cloud Console
- Ensure client ID matches between frontend and backend

**ML models not loading:**
- Models are optional; the app falls back to rule-based logic
- Check `ml_models/` directory structure matches expected paths
- Verify model files are `.joblib` format

---

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 👥 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit with clear messages
5. Push to your fork
6. Create a Pull Request

---

## 📧 Support & Questions

For questions or issues, please open a GitHub issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (Python version, OS, etc.)
