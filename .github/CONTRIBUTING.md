# Contributing to AI Career Intelligence System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- Git

### Setting Up Your Development Environment

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/AI-Career-Intelligence-System.git
   cd AI-Career-Intelligence-System
   ```

2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Set up the backend:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Set up the frontend:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

---

## Development Guidelines

### Code Style

#### Python
- Follow [PEP 8](https://pep8.org/)
- Use type hints for all function signatures
- Keep lines under 100 characters
- Use `from __future__ import annotations` for forward references

#### TypeScript/React
- Use strict TypeScript mode
- Define interfaces for all props and state
- Use descriptive variable and function names
- Prefer functional components with hooks
- Use absolute imports with `@/` alias

### Commit Conventions

Use conventional commits format:
```
<type>(<scope>): <description>

<body>
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation updates
- `style` — Code style changes (formatting, missing semicolons, etc.)
- `refactor` — Code refactoring without feature changes
- `perf` — Performance improvements
- `test` — Test additions or updates
- `chore` — Build scripts, dependencies, tooling

**Example:**
```
feat(resume): add TF-IDF vectorizer caching

- Cache TF-IDF vectorizer results to avoid recomputation
- Reduces resume scoring latency by ~40%
- Closes #123
```

---

## Testing

### Running Tests

**Backend:**
```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=backend

# Run specific test file
pytest tests/unit/test_resume_service.py -v
```

**Frontend:**
```bash
cd frontend
npm test          # Run tests once
npm run test:watch  # Watch mode
```

### Writing Tests

- Write unit tests for all new features
- Aim for >80% code coverage
- Test edge cases and error conditions
- Use descriptive test names

---

## Pull Request Process

1. **Before submitting:**
   - Ensure all tests pass: `pytest tests/` and `npm test`
   - Update documentation if needed
   - Check code style: `pylint backend/` (Python)

2. **Creating the PR:**
   - Use a descriptive title
   - Reference related issues (#123)
   - Describe changes in detail
   - Screenshot UI changes if applicable

3. **Review process:**
   - Maintainers will review your PR
   - Address feedback and suggestions
   - Once approved, your PR will be merged

---

## Architecture Notes

### Backend Structure
- **Routes** handle HTTP requests and validation
- **Services** contain business logic and ML inference
- **Schemas** define Pydantic models for requests/responses
- **Core** contains configuration and logging setup

### Frontend Structure
- **Pages** are full-screen components (routes)
- **Components** are reusable UI pieces
- **Stores** manage global state with Zustand
- **Services** handle API communication

---

## Performance Considerations

- Minimize re-renders in React components
- Use React.memo for expensive components
- Cache ML model predictions when appropriate
- Optimize database queries (if using DB)
- Lazy load routes and code split where possible

---

## Security Guidelines

- Never commit credentials or secrets to Git
- Use environment variables for sensitive data
- Validate and sanitize user input
- Keep dependencies updated: `pip list --outdated`
- Run security checks: `bandit backend/ -r`

---

## Reporting Issues

Found a bug? Please create an issue with:
- **Title:** Clear, concise description
- **Description:** What happened and what you expected
- **Steps to reproduce:** How to trigger the issue
- **Environment:** Python/Node version, OS, etc.
- **Screenshots:** For UI issues

---

## Feature Requests

Have an idea? Submit a feature request with:
- **Use case:** Why you need this feature
- **Proposed solution:** How it should work
- **Alternatives:** Other approaches considered

---

## Questions?

- Open a GitHub discussion
- Review existing documentation in `docs/`
- Check the main README for common issues

Thank you for contributing! 🎉
