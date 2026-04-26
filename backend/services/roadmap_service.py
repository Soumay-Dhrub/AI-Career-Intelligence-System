"""RoadmapService — intelligent, personalized roadmap generator."""
from __future__ import annotations

import numpy as np
from typing import Optional

from backend.core.logging import get_logger
from backend.schemas.roadmap import (
    DailySchedule, IndustryInsight, IntelligentRoadmapResponse,
    Milestone, PhaseTask, ProjectIdea, RoadmapInput, RoadmapPhase,
    RoadmapRequest, RoadmapResponse, WeeklyGoal,
)
from backend.services.model_registry import ModelRegistry

logger = get_logger(__name__)

# ── Resource map ──────────────────────────────────────────────────────────────
RESOURCE_MAP: dict[str, list[str]] = {
    "Python": ["https://docs.python.org", "https://realpython.com"],
    "JavaScript": ["https://javascript.info", "https://developer.mozilla.org"],
    "React": ["https://react.dev/learn", "https://www.freecodecamp.org"],
    "Node.js": ["https://nodejs.org/en/learn", "https://www.theodinproject.com"],
    "SQL": ["https://www.w3schools.com/sql", "https://mode.com/sql-tutorial"],
    "Machine Learning": ["https://scikit-learn.org/stable/tutorial", "https://www.coursera.org/learn/machine-learning"],
    "Deep Learning": ["https://www.deeplearning.ai", "https://pytorch.org/tutorials"],
    "System Design": ["https://github.com/donnemartin/system-design-primer", "https://www.educative.io/courses/grokking-the-system-design-interview"],
    "Data Structures": ["https://www.geeksforgeeks.org/data-structures", "https://leetcode.com"],
    "Algorithms": ["https://www.geeksforgeeks.org/fundamentals-of-algorithms", "https://leetcode.com"],
    "Docker": ["https://docs.docker.com/get-started", "https://www.youtube.com/watch?v=fqMOX6JJhGo"],
    "AWS": ["https://aws.amazon.com/training", "https://www.coursera.org/learn/aws-fundamentals"],
    "TypeScript": ["https://www.typescriptlang.org/docs", "https://www.totaltypescript.com"],
    "Next.js": ["https://nextjs.org/learn", "https://www.youtube.com/c/Fireship"],
    "FastAPI": ["https://fastapi.tiangolo.com/tutorial", "https://realpython.com/fastapi-python-web-apis"],
    "TensorFlow": ["https://www.tensorflow.org/tutorials", "https://www.coursera.org/specializations/deep-learning"],
    "PyTorch": ["https://pytorch.org/tutorials", "https://www.fast.ai"],
    "Git": ["https://git-scm.com/book", "https://learngitbranching.js.org"],
    "LeetCode": ["https://leetcode.com/study-plan", "https://neetcode.io"],
    "GenAI": ["https://www.deeplearning.ai/short-courses", "https://huggingface.co/learn"],
}

# ── Domain knowledge ──────────────────────────────────────────────────────────
DOMAIN_DATA: dict[str, dict] = {
    "web dev": {
        "core": ["HTML", "CSS", "JavaScript", "React", "Node.js", "SQL", "Git", "REST API"],
        "advanced": ["TypeScript", "Next.js", "Docker", "AWS", "Testing", "System Design"],
        "trending": ["Next.js 14", "React Server Components", "Edge Functions", "Web3"],
        "dsa_weight": 0.15,
    },
    "ai/ml": {
        "core": ["Python", "pandas", "numpy", "scikit-learn", "Statistics", "SQL"],
        "advanced": ["TensorFlow", "PyTorch", "Deep Learning", "NLP", "Computer Vision", "MLOps"],
        "trending": ["GenAI", "LLMs", "LangChain", "Vector Databases", "RAG"],
        "dsa_weight": 0.20,
    },
    "data science": {
        "core": ["Python", "SQL", "pandas", "Statistics", "Data Visualization", "Excel"],
        "advanced": ["Machine Learning", "Tableau", "Spark", "A/B Testing", "Feature Engineering"],
        "trending": ["GenAI for Analytics", "dbt", "Snowflake", "Real-time Analytics"],
        "dsa_weight": 0.15,
    },
    "backend": {
        "core": ["Python", "Java", "SQL", "REST API", "Git", "Docker", "System Design"],
        "advanced": ["Kubernetes", "AWS", "Redis", "Microservices", "CI/CD", "Message Queues"],
        "trending": ["Rust", "Go", "gRPC", "Event-Driven Architecture", "Serverless"],
        "dsa_weight": 0.30,
    },
    "devops": {
        "core": ["Linux", "Docker", "Git", "CI/CD", "AWS", "Python", "Bash"],
        "advanced": ["Kubernetes", "Terraform", "Ansible", "Monitoring", "Security"],
        "trending": ["Platform Engineering", "GitOps", "eBPF", "OpenTelemetry"],
        "dsa_weight": 0.10,
    },
    "sde": {
        "core": ["Data Structures", "Algorithms", "System Design", "Python", "Java", "OOP", "SQL"],
        "advanced": ["Distributed Systems", "AWS", "Docker", "Microservices", "LeetCode"],
        "trending": ["AI-assisted coding", "Cloud-native", "Platform Engineering"],
        "dsa_weight": 0.40,
    },
    "mobile": {
        "core": ["Android", "iOS", "React Native", "Flutter", "Git", "REST API"],
        "advanced": ["Firebase", "Testing", "Performance Optimization", "App Store"],
        "trending": ["Flutter 3", "Jetpack Compose", "SwiftUI", "Cross-platform AI"],
        "dsa_weight": 0.20,
    },
}

DSA_LEVEL_SCORE = {"none": 0, "beginner": 20, "easy": 45, "medium": 70, "hard": 90}

INDUSTRY_TRENDS = [
    IndustryInsight(trend="Generative AI & LLMs", demand_level="high", relevance="Every domain now requires AI literacy"),
    IndustryInsight(trend="Cloud-Native Development", demand_level="high", relevance="AWS/GCP/Azure skills are mandatory for most roles"),
    IndustryInsight(trend="Full-Stack with TypeScript", demand_level="high", relevance="TypeScript adoption is near 100% in production codebases"),
    IndustryInsight(trend="DevOps & Platform Engineering", demand_level="high", relevance="CI/CD and containerization expected from all developers"),
    IndustryInsight(trend="System Design", demand_level="high", relevance="Required for all SDE roles at mid-level and above"),
    IndustryInsight(trend="Data Engineering", demand_level="medium", relevance="Growing demand for data pipeline and ETL skills"),
]


class RoadmapService:
    """Legacy + intelligent roadmap generation."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    # ── Legacy ────────────────────────────────────────────────────────────────
    def predict(self, payload: RoadmapRequest) -> RoadmapResponse:
        gap = payload.skill_gap
        current = {s.lower() for s in gap.current_skills}
        missing = [s for s in gap.target_skills if s.lower() not in current]
        if not missing:
            return RoadmapResponse(roadmap=[])
        model = self._registry.get("roadmap_model")
        if model is not None:
            try:
                ranked = _cf_rank(model, missing)
            except Exception as exc:
                logger.warning("roadmap_model failed", extra={"error": str(exc)})
                ranked = missing
        else:
            ranked = missing
        milestones = []
        for priority, skill in enumerate(ranked, start=1):
            resources = RESOURCE_MAP.get(skill, [f"https://www.google.com/search?q={skill.replace(' ', '+')}+tutorial"])
            milestones.append(Milestone(skill=skill, resources=resources, priority=priority))
        milestones.sort(key=lambda m: m.priority)
        return RoadmapResponse(roadmap=milestones)

    # ── Intelligent ───────────────────────────────────────────────────────────
    def generate(self, inp: RoadmapInput) -> IntelligentRoadmapResponse:
        domain_data = _get_domain(inp.domain)
        known_lower = {s.lower() for s in inp.known_skills}
        dsa_score = DSA_LEVEL_SCORE.get(inp.dsa_level, 20)

        # User level
        skill_coverage = len([s for s in domain_data["core"] if s.lower() in known_lower]) / max(len(domain_data["core"]), 1)
        if skill_coverage >= 0.7 and dsa_score >= 60:
            user_level = "advanced"
        elif skill_coverage >= 0.4 or dsa_score >= 40:
            user_level = "intermediate"
        else:
            user_level = "beginner"

        # Skill gaps
        all_required = domain_data["core"] + domain_data["advanced"]
        skill_gaps = [s for s in all_required if s.lower() not in known_lower]
        required_skills = domain_data["core"] + domain_data["advanced"][:4]

        # Phases
        phases = _build_phases(inp, domain_data, user_level, skill_gaps, dsa_score)
        total_weeks = sum(p.duration_weeks for p in phases)

        # Daily schedule
        daily = _build_daily_schedule(inp.hours_per_day, domain_data["dsa_weight"], user_level)

        # Weekly goals (first 8 weeks)
        weekly_goals = _build_weekly_goals(phases, inp.hours_per_day)

        # Projects
        projects = _build_projects(inp.domain, inp.target_role, user_level, inp.known_skills)

        # Interview prep
        interview_prep = _build_interview_prep(inp, dsa_score, inp.target_companies)

        # Mentor insights
        insights = _mentor_insights(inp, user_level, skill_gaps, dsa_score)

        # Next milestone
        next_milestone = phases[0].milestone if phases else "Start with fundamentals"

        # Career summary
        summary = _career_summary(inp, user_level, total_weeks, skill_gaps)

        # Industry insights — filter relevant ones
        relevant_insights = _relevant_insights(inp.domain)

        return IntelligentRoadmapResponse(
            career_path_summary=summary,
            user_level=user_level,
            total_weeks=total_weeks,
            industry_insights=relevant_insights,
            required_skills=required_skills,
            skill_gaps=skill_gaps[:10],
            phases=phases,
            daily_schedule=daily,
            weekly_goals=weekly_goals[:8],
            project_suggestions=projects,
            interview_prep=interview_prep,
            mentor_insights=insights,
            next_milestone=next_milestone,
        )


# ── Helper functions ──────────────────────────────────────────────────────────

def _get_domain(domain_str: str) -> dict:
    d = domain_str.lower().strip()
    for key, data in DOMAIN_DATA.items():
        if key in d or d in key:
            return data
    for key, data in DOMAIN_DATA.items():
        if any(w in d for w in key.split()):
            return data
    return DOMAIN_DATA["sde"]


def _build_phases(inp: RoadmapInput, domain: dict, level: str, gaps: list[str], dsa_score: int) -> list[RoadmapPhase]:
    phases = []
    known_lower = {s.lower() for s in inp.known_skills}

    # Phase 1: Fundamentals (skip if advanced)
    if level != "advanced":
        core_missing = [s for s in domain["core"] if s.lower() not in known_lower][:5]
        weeks1 = 4 if level == "beginner" else 2
        phases.append(RoadmapPhase(
            phase_number=1,
            title="Foundations",
            description=f"Build solid fundamentals in {inp.domain}",
            duration_weeks=weeks1,
            skills=core_missing or domain["core"][:4],
            tasks=[
                PhaseTask(task=f"Learn {s}", duration_weeks=1,
                    resources=RESOURCE_MAP.get(s, [f"https://www.google.com/search?q={s.replace(' ', '+')}+tutorial"]),
                    completed=False)
                for s in (core_missing or domain["core"][:3])
            ],
            milestone=f"Complete {len(core_missing or domain['core'][:4])} core skills",
        ))

    # Phase 2: DSA (always present, weight varies by domain)
    dsa_weeks = 6 if dsa_score < 40 else 4 if dsa_score < 70 else 2
    dsa_topics = _dsa_topics_for_level(inp.dsa_level)
    phases.append(RoadmapPhase(
        phase_number=len(phases) + 1,
        title="DSA & Problem Solving",
        description="Master data structures and algorithms for technical interviews",
        duration_weeks=dsa_weeks,
        skills=["Data Structures", "Algorithms", "LeetCode"],
        tasks=[
            PhaseTask(task=f"Master {topic}", duration_weeks=1,
                resources=["https://leetcode.com", "https://neetcode.io"],
                completed=False)
            for topic in dsa_topics
        ],
        milestone=f"Solve {20 * dsa_weeks} LeetCode problems",
    ))

    # Phase 3: Advanced skills + projects
    adv_skills = [s for s in domain["advanced"] if s.lower() not in known_lower][:5]
    weeks3 = 6 if level == "beginner" else 4
    phases.append(RoadmapPhase(
        phase_number=len(phases) + 1,
        title="Advanced Skills & Projects",
        description=f"Build industry-level projects using advanced {inp.domain} skills",
        duration_weeks=weeks3,
        skills=adv_skills or domain["advanced"][:4],
        tasks=[
            PhaseTask(task=f"Build a project using {s}", duration_weeks=2,
                resources=RESOURCE_MAP.get(s, [f"https://www.google.com/search?q={s.replace(' ', '+')}+project"]),
                completed=False)
            for s in (adv_skills[:2] or domain["advanced"][:2])
        ] + [
            PhaseTask(task="Deploy project to cloud (Vercel/AWS/Heroku)", duration_weeks=1,
                resources=["https://vercel.com/docs", "https://aws.amazon.com/getting-started"],
                completed=False),
            PhaseTask(task="Add project to GitHub with README", duration_weeks=1,
                resources=["https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes"],
                completed=False),
        ],
        milestone="Complete 2 deployed projects with GitHub links",
    ))

    # Phase 4: Interview preparation
    interview_weeks = 4 if inp.year >= 3 else 3
    phases.append(RoadmapPhase(
        phase_number=len(phases) + 1,
        title="Interview Preparation",
        description="Targeted preparation for technical and HR interviews",
        duration_weeks=interview_weeks,
        skills=["System Design", "Behavioral", "Mock Interviews"],
        tasks=[
            PhaseTask(task="System Design fundamentals (HLD + LLD)", duration_weeks=1,
                resources=["https://github.com/donnemartin/system-design-primer"],
                completed=False),
            PhaseTask(task="10 mock interviews on Pramp/InterviewBit", duration_weeks=2,
                resources=["https://www.pramp.com", "https://www.interviewbit.com"],
                completed=False),
            PhaseTask(task="Prepare STAR answers for 10 behavioral questions", duration_weeks=1,
                resources=["https://www.themuse.com/advice/star-interview-method"],
                completed=False),
        ],
        milestone="Complete 10 mock interviews and apply to 20+ companies",
    ))

    return phases


def _dsa_topics_for_level(level: str) -> list[str]:
    topics = {
        "none": ["Arrays & Strings", "Basic Math", "Recursion Basics"],
        "beginner": ["Arrays & Strings", "Linked Lists", "Stacks & Queues"],
        "easy": ["Trees & BST", "Hashing", "Two Pointers", "Sliding Window"],
        "medium": ["Graphs & BFS/DFS", "Dynamic Programming", "Heaps", "Backtracking"],
        "hard": ["Advanced DP", "Segment Trees", "System Design", "Competitive Programming"],
    }
    return topics.get(level, topics["beginner"])


def _build_daily_schedule(hours: float, dsa_weight: float, level: str) -> DailySchedule:
    total_mins = int(hours * 60)
    dsa_mins = int(total_mins * dsa_weight)
    project_mins = int(total_mins * 0.35)
    learning_mins = int(total_mins * 0.40)
    revision_mins = total_mins - dsa_mins - project_mins - learning_mins

    schedule = []
    current = 7 * 60  # 7:00 AM

    def add_slot(mins: int, activity: str):
        nonlocal current
        start = f"{current // 60:02d}:{current % 60:02d}"
        current += mins
        end = f"{current // 60:02d}:{current % 60:02d}"
        schedule.append({"time": f"{start}–{end}", "activity": activity})
        current += 10  # 10-min break between slots

    add_slot(dsa_mins, f"DSA Practice ({dsa_mins} min)")
    add_slot(learning_mins, f"Skill Learning ({learning_mins} min)")
    add_slot(project_mins, f"Project Work ({project_mins} min)")
    if revision_mins > 0:
        add_slot(revision_mins, f"Revision & Notes ({revision_mins} min)")

    return DailySchedule(
        dsa_minutes=dsa_mins,
        learning_minutes=learning_mins,
        project_minutes=project_mins,
        revision_minutes=max(revision_mins, 0),
        total_hours=round(hours, 1),
        schedule=schedule,
    )


def _build_weekly_goals(phases: list[RoadmapPhase], hours: float) -> list[WeeklyGoal]:
    goals = []
    week = 1
    for phase in phases:
        for task in phase.tasks:
            for w in range(task.duration_weeks):
                problems = 14 if hours >= 4 else 10 if hours >= 2 else 5
                goals.append(WeeklyGoal(
                    week_number=week,
                    focus_topic=task.task,
                    tasks=[
                        f"Complete {task.task} — Day 1–5",
                        f"Solve {problems} practice problems",
                        "Review and take notes",
                        "Weekend: mini-project or revision",
                    ],
                    target_problems=problems,
                    mock_test=week % 3 == 0,
                ))
                week += 1
                if week > 8:
                    return goals
    return goals


def _build_projects(domain: str, role: str, level: str, known_skills: list[str]) -> list[ProjectIdea]:
    domain_lower = domain.lower()
    projects = []

    if "web" in domain_lower or "frontend" in role.lower():
        projects = [
            ProjectIdea(title="Full-Stack E-Commerce App", description="Build a complete shopping platform with auth, cart, payments",
                tech_stack=["React", "Node.js", "PostgreSQL", "Stripe API"], difficulty="intermediate",
                impact="Demonstrates full-stack skills, API integration, and real-world complexity"),
            ProjectIdea(title="Real-Time Chat Application", description="WebSocket-based chat with rooms and notifications",
                tech_stack=["React", "Socket.io", "Node.js", "Redis"], difficulty="intermediate",
                impact="Shows real-time systems knowledge — highly valued by interviewers"),
            ProjectIdea(title="Developer Portfolio with Blog", description="Next.js portfolio with MDX blog and dark mode",
                tech_stack=["Next.js", "TypeScript", "Tailwind CSS", "Vercel"], difficulty="beginner",
                impact="Essential for job applications — shows you can ship production code"),
        ]
    elif "ai" in domain_lower or "ml" in domain_lower or "data" in domain_lower:
        projects = [
            ProjectIdea(title="End-to-End ML Pipeline", description="Train, evaluate, and deploy a model with a REST API",
                tech_stack=["Python", "scikit-learn", "FastAPI", "Docker"], difficulty="intermediate",
                impact="Shows you can take ML beyond notebooks to production"),
            ProjectIdea(title="RAG Chatbot with LangChain", description="Build a document Q&A system using LLMs",
                tech_stack=["Python", "LangChain", "OpenAI API", "Pinecone"], difficulty="advanced",
                impact="GenAI is the hottest skill — this project stands out immediately"),
            ProjectIdea(title="Data Dashboard with Insights", description="Interactive analytics dashboard from real dataset",
                tech_stack=["Python", "Streamlit", "pandas", "Plotly"], difficulty="beginner",
                impact="Demonstrates data storytelling and visualization skills"),
        ]
    elif "backend" in domain_lower or "sde" in domain_lower:
        projects = [
            ProjectIdea(title="Scalable URL Shortener", description="Design and build a URL shortener handling 1M+ requests",
                tech_stack=["Python", "FastAPI", "Redis", "PostgreSQL", "Docker"], difficulty="intermediate",
                impact="Classic system design project — shows scalability thinking"),
            ProjectIdea(title="Microservices with Docker", description="Split a monolith into services with API gateway",
                tech_stack=["Python", "Docker", "Kubernetes", "RabbitMQ"], difficulty="advanced",
                impact="Directly maps to how real companies build software"),
            ProjectIdea(title="REST API with Auth & Rate Limiting", description="Production-ready API with JWT, OAuth, and rate limiting",
                tech_stack=["FastAPI", "PostgreSQL", "Redis", "JWT"], difficulty="beginner",
                impact="Every backend role requires this — shows you understand security"),
        ]
    else:
        projects = [
            ProjectIdea(title="Personal Portfolio", description="Showcase your skills and projects",
                tech_stack=["React", "TypeScript", "Tailwind CSS"], difficulty="beginner",
                impact="Essential for job applications"),
            ProjectIdea(title="Domain-Specific Tool", description=f"Build a useful tool in {domain}",
                tech_stack=known_skills[:3] or ["Python", "Git"], difficulty="intermediate",
                impact="Shows practical application of your skills"),
        ]

    return projects[:3]


def _build_interview_prep(inp: RoadmapInput, dsa_score: int, companies: list[str]) -> list[str]:
    prep = [
        "Solve 150+ LeetCode problems (Easy: 50, Medium: 80, Hard: 20)",
        "Practice system design: URL shortener, Twitter feed, WhatsApp",
        "Prepare 10 STAR behavioral answers (leadership, conflict, failure)",
        "Mock interviews: 2 per week for 4 weeks on Pramp or with peers",
        "Resume: tailor for each company, quantify all achievements",
    ]
    if companies:
        for company in companies[:2]:
            c = company.lower()
            if "amazon" in c:
                prep.append("Amazon: Study all 16 Leadership Principles with examples")
            elif "google" in c:
                prep.append("Google: Focus on Hard LeetCode + system design at scale")
            elif "microsoft" in c:
                prep.append("Microsoft: OOP design patterns + Azure basics")
            else:
                prep.append(f"{company}: Research their tech stack and recent engineering blog posts")
    if dsa_score < 50:
        prep.insert(0, "PRIORITY: Solve 50 Easy LeetCode problems before applying anywhere")
    return prep


def _mentor_insights(inp: RoadmapInput, level: str, gaps: list[str], dsa_score: int) -> list[str]:
    insights = []
    if dsa_score < 30 and inp.year >= 3:
        insights.append("🚨 You're in year 3 with weak DSA — this is the #1 reason students get rejected. Fix this first.")
    if inp.project_count == 0:
        insights.append("📦 No projects = nothing to show in interviews. Start building this week, not next month.")
    if inp.hours_per_day < 2:
        insights.append("⏰ Less than 2 hours/day won't get you placed. Minimum 3–4 hours of focused study is needed.")
    if inp.year == 4 and not inp.has_internship:
        insights.append("🚨 Final year, no internship — apply to 10+ companies this week. Any experience is better than none.")
    if len(gaps) > 8:
        insights.append(f"📚 You have {len(gaps)} skill gaps. Don't try to learn everything — focus on the top 3 for your target role.")
    if inp.year <= 2:
        insights.append("🌱 You have time on your side. Build strong fundamentals now — don't rush to advanced topics.")
    if "GenAI" not in inp.known_skills and "AI" in inp.domain.upper():
        insights.append("🤖 GenAI is the hottest skill in 2025. Add LangChain or Hugging Face to your stack.")
    if not insights:
        insights.append("✅ You're on the right track. Stay consistent and keep building.")
    return insights[:4]


def _career_summary(inp: RoadmapInput, level: str, weeks: int, gaps: list[str]) -> str:
    months = round(weeks / 4.3, 1)
    return (
        f"As a {inp.year}{'st' if inp.year==1 else 'nd' if inp.year==2 else 'rd' if inp.year==3 else 'th'}-year student "
        f"targeting {inp.target_role} in {inp.domain}, you're at {level} level. "
        f"Your personalized roadmap spans {weeks} weeks (~{months} months) covering {len(gaps)} skill gaps. "
        f"With {inp.hours_per_day}h/day of focused effort, you'll be interview-ready for "
        f"{', '.join(inp.target_companies[:2]) if inp.target_companies else 'top companies'}."
    )


def _relevant_insights(domain: str) -> list[IndustryInsight]:
    domain_lower = domain.lower()
    relevant = []
    for insight in INDUSTRY_TRENDS:
        trend_lower = insight.trend.lower()
        if "ai" in domain_lower and "ai" in trend_lower:
            relevant.append(insight)
        elif "web" in domain_lower and "typescript" in trend_lower:
            relevant.append(insight)
        elif "devops" in domain_lower and "devops" in trend_lower:
            relevant.append(insight)
        elif "system design" in trend_lower or "cloud" in trend_lower:
            relevant.append(insight)
    return relevant[:4] or INDUSTRY_TRENDS[:3]


def _cf_rank(model, skills: list[str]) -> list[str]:
    scores = model.predict([[i] for i in range(len(skills))])
    return [s for _, s in sorted(zip(scores, skills))]

