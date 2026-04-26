"""Job role knowledge base — required skills, keywords, and tips per role."""
from __future__ import annotations

JOB_ROLES: dict[str, dict] = {
    "amazon sde": {
        "title": "Amazon SDE",
        "required_skills": [
            "Data Structures", "Algorithms", "System Design", "Python", "Java",
            "C++", "OOP", "SQL", "REST API", "Microservices", "AWS", "Docker",
            "Git", "Problem Solving", "LeetCode", "Distributed Systems",
        ],
        "keywords": [
            "scalability", "distributed", "low latency", "high availability",
            "object oriented", "design patterns", "agile", "code review",
            "unit testing", "ci/cd", "leadership principles",
        ],
        "tips": [
            "Add DSA-heavy projects (e.g., custom data structures, graph algorithms)",
            "Mention competitive programming profiles (LeetCode, Codeforces)",
            "Include system design experience (load balancers, caching, queues)",
            "Highlight scalability and high-availability projects",
            "Reference Amazon Leadership Principles in your experience bullets",
        ],
        "template": "ATS-Minimal",
    },
    "data scientist": {
        "title": "Data Scientist",
        "required_skills": [
            "Python", "Machine Learning", "Deep Learning", "SQL", "pandas",
            "numpy", "scikit-learn", "TensorFlow", "PyTorch", "Statistics",
            "Data Visualization", "NLP", "Feature Engineering", "A/B Testing",
            "Jupyter", "Git",
        ],
        "keywords": [
            "model training", "cross validation", "hyperparameter tuning",
            "regression", "classification", "clustering", "neural network",
            "data pipeline", "etl", "business insights", "predictive modeling",
        ],
        "tips": [
            "Quantify model improvements (e.g., 'improved accuracy by 12%')",
            "Include Kaggle competitions or research publications",
            "Mention end-to-end ML pipelines, not just model training",
            "Add data storytelling and visualization projects",
            "Highlight business impact of your models",
        ],
        "template": "ATS-Clean",
    },
    "frontend developer": {
        "title": "Frontend Developer",
        "required_skills": [
            "JavaScript", "TypeScript", "React", "HTML", "CSS", "Git",
            "REST API", "Responsive Design", "Webpack", "Testing",
            "Performance Optimization", "Accessibility",
        ],
        "keywords": [
            "component", "state management", "hooks", "spa", "pwa",
            "cross browser", "ui/ux", "figma", "lighthouse", "web vitals",
        ],
        "tips": [
            "Link to live projects or GitHub repos",
            "Mention Core Web Vitals improvements",
            "Include accessibility (WCAG) experience",
            "Add design system or component library contributions",
        ],
        "template": "ATS-Modern",
    },
    "backend developer": {
        "title": "Backend Developer",
        "required_skills": [
            "Python", "Java", "Node.js", "SQL", "PostgreSQL", "MongoDB",
            "REST API", "Docker", "Kubernetes", "AWS", "Redis", "Git",
            "Microservices", "System Design", "CI/CD",
        ],
        "keywords": [
            "api design", "database optimization", "caching", "message queue",
            "authentication", "authorization", "scalability", "monitoring",
        ],
        "tips": [
            "Highlight API design and database optimization experience",
            "Mention throughput/latency improvements with numbers",
            "Include cloud infrastructure and DevOps experience",
            "Add security practices (OAuth, JWT, rate limiting)",
        ],
        "template": "ATS-Minimal",
    },
    "machine learning engineer": {
        "title": "ML Engineer",
        "required_skills": [
            "Python", "Machine Learning", "TensorFlow", "PyTorch", "MLOps",
            "Docker", "Kubernetes", "AWS", "SQL", "Feature Engineering",
            "Model Deployment", "CI/CD", "Git", "Data Pipelines",
        ],
        "keywords": [
            "model serving", "inference", "training pipeline", "mlflow",
            "kubeflow", "feature store", "monitoring", "drift detection",
        ],
        "tips": [
            "Show end-to-end ML system experience (training → serving)",
            "Mention model monitoring and retraining pipelines",
            "Include MLOps tools (MLflow, Kubeflow, SageMaker)",
            "Quantify model performance and business impact",
        ],
        "template": "ATS-Clean",
    },
    "devops engineer": {
        "title": "DevOps Engineer",
        "required_skills": [
            "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD",
            "Terraform", "Ansible", "Linux", "Git", "Python", "Monitoring",
            "Jenkins", "GitHub Actions",
        ],
        "keywords": [
            "infrastructure as code", "deployment automation", "container orchestration",
            "observability", "incident response", "sre", "uptime", "pipeline",
        ],
        "tips": [
            "Quantify uptime improvements and deployment frequency",
            "Mention IaC tools (Terraform, Pulumi)",
            "Include cost optimization achievements",
            "Add on-call and incident response experience",
        ],
        "template": "ATS-Minimal",
    },
}

# Normalize lookup
_NORMALIZED: dict[str, dict] = {}
for k, v in JOB_ROLES.items():
    _NORMALIZED[k.lower().strip()] = v


def get_role(role_name: str) -> dict | None:
    """Fuzzy match a role name to the knowledge base."""
    query = role_name.lower().strip()
    # Exact match
    if query in _NORMALIZED:
        return _NORMALIZED[query]
    # Partial match
    for key, data in _NORMALIZED.items():
        if query in key or key in query:
            return data
    # Keyword match
    for key, data in _NORMALIZED.items():
        words = set(query.split())
        key_words = set(key.split())
        if words & key_words:
            return data
    return None


def list_roles() -> list[str]:
    return [v["title"] for v in JOB_ROLES.values()]
