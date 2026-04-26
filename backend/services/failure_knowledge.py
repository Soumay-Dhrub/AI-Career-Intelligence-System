"""Domain knowledge base for Failure Intelligence System."""
from __future__ import annotations

# Domain → required skills + weights
DOMAIN_REQUIREMENTS: dict[str, dict] = {
    "web dev": {
        "core_skills": ["HTML", "CSS", "JavaScript", "React", "Node.js", "REST API", "Git", "SQL"],
        "advanced_skills": ["TypeScript", "Docker", "AWS", "Testing", "CI/CD"],
        "dsa_weight": 0.15,
        "project_weight": 0.30,
        "description": "Web Development",
    },
    "ai/ml": {
        "core_skills": ["Python", "Machine Learning", "pandas", "numpy", "scikit-learn", "Statistics"],
        "advanced_skills": ["TensorFlow", "PyTorch", "Deep Learning", "NLP", "Computer Vision"],
        "dsa_weight": 0.20,
        "project_weight": 0.35,
        "description": "AI/ML",
    },
    "data science": {
        "core_skills": ["Python", "SQL", "pandas", "Statistics", "Data Visualization", "Machine Learning"],
        "advanced_skills": ["Tableau", "Power BI", "Spark", "A/B Testing", "Feature Engineering"],
        "dsa_weight": 0.15,
        "project_weight": 0.30,
        "description": "Data Science",
    },
    "backend": {
        "core_skills": ["Python", "Java", "SQL", "REST API", "Docker", "Git", "System Design"],
        "advanced_skills": ["Kubernetes", "AWS", "Redis", "Microservices", "CI/CD"],
        "dsa_weight": 0.30,
        "project_weight": 0.25,
        "description": "Backend Development",
    },
    "devops": {
        "core_skills": ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS", "Git", "Python"],
        "advanced_skills": ["Terraform", "Ansible", "Monitoring", "Security", "Networking"],
        "dsa_weight": 0.10,
        "project_weight": 0.35,
        "description": "DevOps/Cloud",
    },
    "mobile": {
        "core_skills": ["Android", "iOS", "React Native", "Flutter", "Git", "REST API"],
        "advanced_skills": ["Firebase", "Testing", "App Store", "Performance Optimization"],
        "dsa_weight": 0.20,
        "project_weight": 0.35,
        "description": "Mobile Development",
    },
    "sde": {
        "core_skills": ["Data Structures", "Algorithms", "System Design", "Python", "Java", "OOP", "SQL"],
        "advanced_skills": ["Distributed Systems", "AWS", "Docker", "Microservices", "LeetCode"],
        "dsa_weight": 0.40,
        "project_weight": 0.20,
        "description": "Software Development Engineer",
    },
}

# Company → requirements
COMPANY_REQUIREMENTS: dict[str, dict] = {
    "amazon": {
        "critical_skills": ["Data Structures", "Algorithms", "System Design", "OOP"],
        "preferred_skills": ["Java", "Python", "AWS", "Distributed Systems"],
        "min_dsa": "medium",
        "min_projects": 2,
        "min_cgpa": 7.0,
        "prep_weeks_base": 12,
        "tier": 1,
    },
    "google": {
        "critical_skills": ["Data Structures", "Algorithms", "System Design"],
        "preferred_skills": ["Python", "C++", "Distributed Systems", "Machine Learning"],
        "min_dsa": "hard",
        "min_projects": 3,
        "min_cgpa": 8.0,
        "prep_weeks_base": 20,
        "tier": 1,
    },
    "microsoft": {
        "critical_skills": ["Data Structures", "Algorithms", "OOP", "System Design"],
        "preferred_skills": ["C#", "Java", "Python", "Azure"],
        "min_dsa": "medium",
        "min_projects": 2,
        "min_cgpa": 7.5,
        "prep_weeks_base": 14,
        "tier": 1,
    },
    "infosys": {
        "critical_skills": ["OOP", "SQL", "Java", "Python"],
        "preferred_skills": ["REST API", "Git", "Agile"],
        "min_dsa": "easy",
        "min_projects": 1,
        "min_cgpa": 6.5,
        "prep_weeks_base": 6,
        "tier": 2,
    },
    "tcs": {
        "critical_skills": ["OOP", "SQL", "Java"],
        "preferred_skills": ["Python", "Git", "Communication"],
        "min_dsa": "easy",
        "min_projects": 1,
        "min_cgpa": 6.0,
        "prep_weeks_base": 4,
        "tier": 2,
    },
    "wipro": {
        "critical_skills": ["OOP", "SQL", "Java", "Python"],
        "preferred_skills": ["REST API", "Git"],
        "min_dsa": "easy",
        "min_projects": 1,
        "min_cgpa": 6.0,
        "prep_weeks_base": 4,
        "tier": 2,
    },
}

DSA_LEVEL_ORDER = ["none", "beginner", "easy", "medium", "hard"]
DSA_LEVEL_SCORE = {"none": 0, "beginner": 20, "easy": 45, "medium": 70, "hard": 90}
CONSISTENCY_SCORE = {
    "very_irregular": 10, "irregular": 30, "moderate": 55, "regular": 75, "very_regular": 95
}
PROJECT_TYPE_SCORE = {"none": 0, "basic": 30, "real-world": 65, "scalable": 90}


def get_domain(domain_str: str) -> dict:
    """Fuzzy match domain string to knowledge base."""
    d = domain_str.lower().strip()
    for key, data in DOMAIN_REQUIREMENTS.items():
        if key in d or d in key:
            return data
    # Keyword match
    for key, data in DOMAIN_REQUIREMENTS.items():
        if any(w in d for w in key.split()):
            return data
    return DOMAIN_REQUIREMENTS["sde"]  # default


def get_company(company_str: str) -> dict | None:
    """Fuzzy match company name."""
    c = company_str.lower().strip()
    for key, data in COMPANY_REQUIREMENTS.items():
        if key in c or c in key:
            return {**data, "name": key.title()}
    return None
