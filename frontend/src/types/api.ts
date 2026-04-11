// --- Shared ---
export interface Milestone {
  skill: string
  resources: string[]
  priority: number
}

// --- PlacementReport (POST /analyze response) ---
export interface PlacementReport {
  placement_probability: number // 0.0 – 1.0
  risk_level: 'Low' | 'Medium' | 'High'
  consistency_score: number // 0.0 – 1.0
  burnout_risk: 'Low' | 'Medium' | 'High'
  resume_score: number // 0.0 – 1.0
  missing_skills: string[]
  internship_score: number // 0.0 – 10.0
  placement_boost: number // 0.0 – 1.0
  failure_reasons: string[]
  weak_areas: string[]
  roadmap: Milestone[]
}

// --- Analyze request ---
export interface StudyLog {
  daily_hours: number[]
  dates: string[] // ISO date strings
}

export interface InternshipPayload {
  duration_months: number
  company_tier: number // 1–3
  role_relevance: number // 0.0–1.0
  project_count: number
}

export interface SubjectScore {
  subject: string
  score: number
}

export interface PerformanceData {
  subject_scores: SubjectScore[]
  backlogs: number
  project_failures: number
}

export interface SkillGap {
  current_skills: string[]
  target_skills: string[]
  target_role: string
}

export interface AnalyzeRequest {
  study_log: StudyLog
  resume_text: string
  job_description: string
  internship: InternshipPayload
  performance: PerformanceData
  skill_gap: SkillGap
}

// --- Auth ---
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: { name: string; email: string }
}

export interface SignupRequest {
  name: string
  email: string
  password: string
}

// --- Resume endpoint ---
export interface ResumeRequest {
  resume_text: string
  job_description: string
}

export interface ResumeResponse {
  resume_score: number
  keyword_match: number
  missing_skills: string[]
}

// --- Burnout endpoint ---
export interface BurnoutRequest {
  study_log: StudyLog
}

export interface BurnoutResponse {
  burnout_risk: 'Low' | 'Medium' | 'High'
  consistency_score: number
}

// --- Internship endpoint ---
export interface InternshipResponse {
  internship_score: number
  placement_boost: number
}

// --- Failure endpoint ---
export interface FailureResponse {
  failure_reasons: string[]
  weak_areas: string[]
}

// --- Roadmap endpoint ---
export interface RoadmapResponse {
  roadmap: Milestone[]
}

// --- API Error ---
export interface ApiError {
  status: number
  message: string
}
