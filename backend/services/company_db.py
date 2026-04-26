"""Company knowledge base — tier classification and domain mapping."""
from __future__ import annotations

# Tier 1: Top MNCs (FAANG + equivalents)
TIER1_COMPANIES = {
    "google", "amazon", "microsoft", "meta", "apple", "netflix",
    "uber", "airbnb", "linkedin", "twitter", "salesforce", "adobe",
    "oracle", "ibm", "intel", "nvidia", "qualcomm", "cisco",
    "goldman sachs", "morgan stanley", "jpmorgan", "deloitte", "mckinsey",
}

# Tier 2: Strong mid-level companies
TIER2_COMPANIES = {
    "infosys", "tcs", "wipro", "hcl", "cognizant", "accenture",
    "capgemini", "tech mahindra", "mphasis", "hexaware",
    "fedex", "3m", "bayer", "deere", "mondelez", "ryder",
    "pnc", "usaa", "hess", "adani", "zee entertainment",
    "paytm", "flipkart", "zomato", "swiggy", "ola", "byju",
    "razorpay", "freshworks", "zoho", "browserstack",
}

# Domain → skill keywords mapping
DOMAIN_SKILLS: dict[str, list[str]] = {
    "software engineering": [
        "python", "java", "c++", "data structures", "algorithms",
        "system design", "rest api", "git", "oop", "sql",
    ],
    "data science": [
        "python", "machine learning", "pandas", "numpy", "sql",
        "statistics", "scikit-learn", "tensorflow", "data visualization",
    ],
    "web development": [
        "javascript", "react", "html", "css", "node.js",
        "typescript", "rest api", "git", "responsive design",
    ],
    "machine learning": [
        "python", "tensorflow", "pytorch", "scikit-learn",
        "deep learning", "nlp", "computer vision", "pandas",
    ],
    "devops": [
        "docker", "kubernetes", "aws", "ci/cd", "linux",
        "terraform", "git", "python", "monitoring",
    ],
    "mobile development": [
        "android", "ios", "react native", "flutter", "kotlin",
        "swift", "java", "firebase",
    ],
    "cybersecurity": [
        "networking", "linux", "python", "penetration testing",
        "cryptography", "firewalls", "siem",
    ],
    "cloud computing": [
        "aws", "gcp", "azure", "docker", "kubernetes",
        "terraform", "python", "linux",
    ],
    "ai/ml": [
        "python", "machine learning", "deep learning", "nlp",
        "tensorflow", "pytorch", "computer vision", "data science",
    ],
    "product management": [
        "product roadmap", "agile", "scrum", "user research",
        "data analysis", "sql", "communication",
    ],
}


def classify_company_tier(company_name: str) -> int:
    """Return 1 (MNC), 2 (mid), or 3 (startup/other)."""
    name = company_name.lower().strip()
    if any(t in name for t in TIER1_COMPANIES):
        return 1
    if any(t in name for t in TIER2_COMPANIES):
        return 2
    return 3


def get_domain_skills(domain: str) -> list[str]:
    """Return required skills for a domain."""
    domain_lower = domain.lower().strip()
    for key, skills in DOMAIN_SKILLS.items():
        if domain_lower in key or key in domain_lower:
            return skills
    # Fuzzy: match any word
    for key, skills in DOMAIN_SKILLS.items():
        if any(w in key for w in domain_lower.split()):
            return skills
    return ["python", "git", "communication", "problem solving"]
