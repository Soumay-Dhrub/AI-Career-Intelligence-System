"""ML analysis API routes."""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.connection import get_db
from backend.database.models import Student, Prediction
from backend.routes.auth import get_current_user
from backend.services.ml_integration import (
    placement_ml_service, behavioral_ml_service, internship_ml_service, resume_ml_service
)
from backend.schemas.api import (
    PlacementReport, AnalyzeRequest, BurnoutRequest, BurnoutResponse,
    ResumeAnalysisRequest, ResumeAnalysisResponse, InternshipImpactRequest,
    InternshipImpactResponse, RoadmapRequest, RoadmapResponse,
    FailureAnalysisRequest, FailureAnalysisResponse
)

router = APIRouter(prefix="/analyze", tags=["analysis"])


@router.post("/placement/{student_id}", response_model=PlacementReport)
async def predict_placement(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Predict placement probability for a student."""
    try:
        # Get placement prediction
        probability, risk_level = placement_ml_service.predict_placement(db, student_id)

        # Get behavioral analysis
        behavioral_result = behavioral_ml_service.analyze_behavior(db, student_id)

        # Get internship impact (aggregate all internships)
        internship_result = internship_ml_service.analyze_internship_impact(db, student_id)

        # Get resume analysis (if available)
        resume_result = {"resume_score": 0.0, "missing_skills": []}
        resume = db.query(Resume).filter(Resume.student_id == student_id).first()
        if resume and resume.resume_text:
            # Need job description - use a default or get from recent applications
            job_desc = "Software developer with Python, machine learning, and web development skills"
            resume_result = resume_ml_service.analyze_resume(resume.resume_text, job_desc)

        # Create comprehensive report
        report = PlacementReport(
            student_id=student_id,
            placement_probability=probability,
            risk_level=risk_level,
            burnout_risk=behavioral_result["burnout_risk"],
            consistency_score=behavioral_result["consistency_score"],
            resume_score=resume_result["resume_score"],
            internship_score=internship_result["internship_score"],
            placement_boost=internship_result["placement_boost"],
            failure_reasons=[],  # Would need failure analysis service
            weak_areas=[],       # Would need failure analysis service
            roadmap=[],          # Would need roadmap service
            recommendations=[]
        )

        # Save prediction to database
        prediction = Prediction(
            student_id=student_id,
            placement_probability=probability,
            risk_level=risk_level,
            burnout_risk=behavioral_result["burnout_risk"],
            consistency_score=behavioral_result["consistency_score"],
            internship_score=internship_result["internship_score"],
            placement_boost=internship_result["placement_boost"],
            failure_reasons=[],
            weak_areas=[],
            roadmap=[]
        )
        db.add(prediction)
        db.commit()

        return report

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/burnout/{student_id}", response_model=BurnoutResponse)
async def analyze_burnout(
    student_id: int,
    burnout_data: BurnoutRequest,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Analyze burnout risk from study patterns."""
    try:
        # Save behavioral data to database
        for i, (hours, date_str) in enumerate(zip(burnout_data.daily_hours, burnout_data.dates)):
            from datetime import datetime
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))

            behavioral_data = BehavioralData(
                student_id=student_id,
                date=date_obj,
                study_hours=hours,
                consistency_score=0.8 if hours > 6 else 0.5  # Simple consistency calculation
            )
            db.add(behavioral_data)

        db.commit()

        # Analyze with ML model
        result = behavioral_ml_service.analyze_behavior(db, student_id)

        recommendations = []
        if result["burnout_risk"] == "High":
            recommendations = [
                "Reduce study hours and focus on quality over quantity",
                "Take regular breaks and maintain work-life balance",
                "Consider consulting a career counselor"
            ]
        elif result["burnout_risk"] == "Medium":
            recommendations = [
                "Maintain consistent study schedule",
                "Include recreational activities in daily routine",
                "Monitor stress levels regularly"
            ]

        return BurnoutResponse(
            burnout_risk=result["burnout_risk"],
            consistency_score=result["consistency_score"],
            recommendations=recommendations
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Burnout analysis failed: {str(e)}"
        )


@router.post("/resume/{student_id}", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    student_id: int,
    resume_data: ResumeAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Analyze resume against job description."""
    try:
        # Analyze with ML model
        result = resume_ml_service.analyze_resume(
            resume_data.resume_text,
            resume_data.job_description
        )

        # Save/update resume in database
        existing_resume = db.query(Resume).filter(Resume.student_id == student_id).first()
        if existing_resume:
            existing_resume.resume_text = resume_data.resume_text
            existing_resume.resume_score = result["resume_score"]
            existing_resume.extracted_skills = result.get("extracted_skills", [])
            existing_resume.missing_skills = result["missing_skills"]
        else:
            resume = Resume(
                student_id=student_id,
                resume_text=resume_data.resume_text,
                resume_score=result["resume_score"],
                extracted_skills=result.get("extracted_skills", []),
                missing_skills=result["missing_skills"]
            )
            db.add(resume)

        db.commit()

        recommendations = []
        if result["resume_score"] < 0.5:
            recommendations = [
                "Add more relevant keywords from the job description",
                "Highlight quantifiable achievements",
                "Tailor resume to match job requirements"
            ]
        elif result["missing_skills"]:
            recommendations = [
                f"Consider learning: {', '.join(result['missing_skills'][:3])}",
                "Update resume with recent projects",
                "Get certifications for missing skills"
            ]

        return ResumeAnalysisResponse(
            resume_score=result["resume_score"],
            missing_skills=result["missing_skills"],
            extracted_skills=result.get("extracted_skills", []),
            recommendations=recommendations
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume analysis failed: {str(e)}"
        )


@router.post("/internship/{student_id}", response_model=InternshipImpactResponse)
async def analyze_internship_impact(
    student_id: int,
    internship_data: InternshipImpactRequest,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Analyze internship impact on placement."""
    try:
        # Save internship data
        internship = Internship(
            student_id=student_id,
            duration_months=internship_data.duration_months,
            company_tier=internship_data.company_tier,
            role_relevance=internship_data.role_relevance,
            project_count=internship_data.project_count
        )
        db.add(internship)
        db.commit()

        # Analyze with ML model
        result = internship_ml_service.analyze_internship_impact(db, student_id)

        recommendations = []
        if result["internship_score"] < 5:
            recommendations = [
                "Consider internships at higher-tier companies",
                "Focus on roles more relevant to your career goals",
                "Increase project involvement during internship"
            ]
        else:
            recommendations = [
                "Great internship experience!",
                "Highlight this experience in your resume",
                "Network with colleagues for future opportunities"
            ]

        return InternshipImpactResponse(
            internship_score=result["internship_score"],
            placement_boost=result["placement_boost"],
            recommendations=recommendations
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internship analysis failed: {str(e)}"
        )


@router.post("/failure/{student_id}", response_model=FailureAnalysisResponse)
async def analyze_failure_patterns(
    student_id: int,
    performance_data: FailureAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Analyze academic performance and identify failure patterns."""
    try:
        # Simple rule-based analysis (could be enhanced with ML)
        failure_reasons = []
        weak_areas = []

        # Analyze subject scores
        for subject_data in performance_data.subject_scores:
            score = subject_data["score"]
            subject = subject_data["subject"]

            if score < 40:
                failure_reasons.append(f"Critical performance in {subject}")
                weak_areas.append(subject)
            elif score < 60:
                failure_reasons.append(f"Below average performance in {subject}")
                weak_areas.append(subject)

        # Analyze CGPA
        if performance_data.cgpa < 6.0:
            failure_reasons.append("Low overall CGPA")
        elif performance_data.cgpa < 7.0:
            failure_reasons.append("Below average CGPA")

        recommendations = []
        if weak_areas:
            recommendations = [
                f"Focus on improving: {', '.join(weak_areas)}",
                "Consider additional tutoring or study groups",
                "Review fundamental concepts in weak areas"
            ]
        else:
            recommendations = [
                "Maintain consistent performance",
                "Focus on practical applications",
                "Prepare for competitive exams"
            ]

        return FailureAnalysisResponse(
            failure_reasons=failure_reasons,
            weak_areas=weak_areas,
            recommendations=recommendations
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failure analysis failed: {str(e)}"
        )


@router.post("/roadmap/{student_id}", response_model=RoadmapResponse)
async def generate_roadmap(
    student_id: int,
    skill_gap: RoadmapRequest,
    db: Session = Depends(get_db),
    current_user: Student = Depends(get_current_user)
) -> Any:
    """Generate personalized learning roadmap."""
    try:
        # Simple rule-based roadmap generation (could be enhanced with ML)
        missing_skills = [skill for skill in skill_gap.target_skills
                         if skill not in skill_gap.current_skills]

        milestones = []
        priority = 1

        for skill in missing_skills[:5]:  # Limit to top 5 skills
            resources = [f"Online courses for {skill}", f"Practice projects in {skill}"]
            if "Python" in skill:
                resources.append("LeetCode Python problems")
            elif "ML" in skill.lower():
                resources.append("Kaggle datasets and competitions")

            milestones.append({
                "skill": skill,
                "resources": resources,
                "priority": priority,
                "estimated_time": "2-4 weeks"
            })
            priority += 1

        total_time = f"{len(milestones) * 3}-{len(milestones) * 5} weeks"

        return RoadmapResponse(
            milestones=milestones,
            total_estimated_time=total_time
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Roadmap generation failed: {str(e)}"
        )