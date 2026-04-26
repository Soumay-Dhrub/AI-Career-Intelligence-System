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

export interface StudentProfile {
  year: number
  course: string
  cgpa: number
  skills: string[]
  project_count: number
  project_domains: string[]
  target_domain: string
  ats_score?: number
  resume_score?: number
}

export interface PlacementImpact {
  level: 'High' | 'Medium' | 'Low'
  explanation: string
}

export interface CompanyRecommendation {
  company: string
  role: string
  tier: number
  tier_label: string
  match_score: number
  selection_probability: number
  required_skills: string[]
  matched_skills: string[]
  missing_skills: string[]
  location: string
  salary_range: string
  placement_impact: PlacementImpact
  reason: string
}

export interface ProfileAnalysisResponse {
  readiness_score: number
  readiness_label: string
  company_recommendations: CompanyRecommendation[]
  placement_impact_summary: string
  improvement_suggestions: string[]
  top_missing_skills: string[]
  profile_strengths: string[]
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

export interface ImprovementSuggestion {
  category: string
  original?: string
  suggestion: string
  reason: string
}

export interface ResumeResponse {
  ats_score: number
  resume_score: number
  keyword_match: number
  skill_match_pct: number
  matched_skills: string[]
  missing_skills: string[]
  weak_keywords: string[]
  suggestions: ImprovementSuggestion[]
  role_specific_tips: string[]
  template_recommendation: string
  template_reason: string
  summary: string
  section_breakdown?: {
    keyword_match: number
    semantic_similarity: number
    structure: number
    experience_quality: number
    skill_gap_penalty: number
  }
}

// --- Burnout endpoint ---
export interface DailyScheduleInput {
  study_hours: number
  sleep_hours: number
  college_hours: number
  break_hours: number
  other_hours: number
}

export interface BurnoutRequest {
  study_log: StudyLog
  daily_schedule?: DailyScheduleInput
  mood_description?: string
}

export interface EmotionTag {
  label: string
  confidence: number
}

export interface TimeBlock {
  start: string
  end: string
  activity: string
  category: 'study' | 'break' | 'sleep' | 'college' | 'other'
}

export interface BurnoutResponse {
  consistency_score: number
  burnout_risk: 'Low' | 'Medium' | 'High'
  burnout_level: number
  workload_ratio: number
  rest_efficiency: number
  overwork_detected: boolean
  sleep_deprivation_detected: boolean
  emotion_analysis?: {
    sentiment: string
    score: number
    tags: EmotionTag[]
    summary: string
  }
  optimized_schedule?: TimeBlock[]
  recommendations: string[]
  insights: string
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

export type DSALevel = 'none' | 'beginner' | 'easy' | 'medium' | 'hard'
export type ProjectType = 'none' | 'basic' | 'real-world' | 'scalable'
export type ConsistencyLevel = 'very_irregular' | 'irregular' | 'moderate' | 'regular' | 'very_regular'

export interface StudentAssessment {
  year: number
  domain: string
  tech_stack: string[]
  dsa_level: DSALevel
  dsa_problems_solved: number
  coding_ability: number
  aptitude_level: number
  verbal_ability: number
  project_count: number
  project_type: ProjectType
  has_internship: boolean
  internship_months: number
  rejection_count: number
  daily_study_hours: number
  consistency: ConsistencyLevel
  mock_interviews_done: number
  target_company?: string
  target_role?: string
}

export interface DimensionScore {
  name: string
  score: number
  weight: number
  label: 'Strong' | 'Average' | 'Weak'
  insight: string
}

export interface RootCause {
  cause: string
  severity: 'critical' | 'moderate' | 'minor'
  explanation: string
  fix: string
}

export interface WeeklyPlan {
  week: string
  focus: string
  tasks: string[]
  daily_target: string
}

export interface CompanyReadiness {
  company: string
  ready: boolean
  readiness_pct: number
  missing: string[]
  prep_weeks: number
  verdict: string
}

export interface FailureIntelligenceResponse {
  overall_score: number
  failure_risk_pct: number
  placement_readiness_pct: number
  dimensions: DimensionScore[]
  strengths: string[]
  weaknesses: string[]
  root_causes: RootCause[]
  intelligent_insights: string[]
  domain_readiness: Record<string, number>
  company_readiness?: CompanyReadiness
  action_plan: WeeklyPlan[]
  skill_gaps: string[]
  mentor_summary: string
}

// --- Roadmap endpoint ---
export interface RoadmapResponse {
  roadmap: Milestone[]
}

export interface RoadmapInput {
  year: number
  domain: string
  target_role: string
  known_skills: string[]
  dsa_level: DSALevel
  project_count: number
  has_internship: boolean
  target_companies: string[]
  hours_per_day: number
}

export interface PhaseTask {
  task: string
  duration_weeks: number
  resources: string[]
  completed: boolean
}

export interface RoadmapPhase {
  phase_number: number
  title: string
  description: string
  duration_weeks: number
  skills: string[]
  tasks: PhaseTask[]
  milestone: string
}

export interface DailyScheduleRoadmap {
  dsa_minutes: number
  learning_minutes: number
  project_minutes: number
  revision_minutes: number
  total_hours: number
  schedule: { time: string; activity: string }[]
}

export interface WeeklyGoalRoadmap {
  week_number: number
  focus_topic: string
  tasks: string[]
  target_problems: number
  mock_test: boolean
}

export interface ProjectIdea {
  title: string
  description: string
  tech_stack: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  impact: string
}

export interface IndustryInsight {
  trend: string
  demand_level: 'high' | 'medium' | 'low'
  relevance: string
}

export interface IntelligentRoadmapResponse {
  career_path_summary: string
  user_level: 'beginner' | 'intermediate' | 'advanced'
  total_weeks: number
  industry_insights: IndustryInsight[]
  required_skills: string[]
  skill_gaps: string[]
  phases: RoadmapPhase[]
  daily_schedule: DailyScheduleRoadmap
  weekly_goals: WeeklyGoalRoadmap[]
  project_suggestions: ProjectIdea[]
  interview_prep: string[]
  mentor_insights: string[]
  next_milestone: string
}

// --- Placement Predictor ---
export interface ModuleScores {
  core_assessment: number
  resume_ats: number
  failure_risk: number
  internship_readiness: number
  roadmap_consistency: number
}

export interface CompanyReadinessItem {
  company: string
  readiness_pct: number
  ready: boolean
  missing_skills: string[]
  prep_weeks: number
}

export interface WhatIfScenario {
  scenario: string
  current_score: number
  projected_score: number
  delta: number
  action: string
}

export interface PriorityAction {
  rank: number
  action: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  timeline: string
}

export interface PlacementPrediction {
  placement_score: number
  readiness_level: 'Not Ready' | 'Needs Improvement' | 'Almost Ready' | 'Ready'
  selection_probability: number
  risk_level: 'Low' | 'Medium' | 'High'
  confidence_score: number
  module_scores: ModuleScores
  score_breakdown: Record<string, number>
  strengths: string[]
  weaknesses: string[]
  smart_insights: string[]
  root_causes: string[]
  skill_gaps: string[]
  top_missing_skills: string[]
  company_readiness: CompanyReadinessItem[]
  priority_actions: PriorityAction[]
  weekly_plan: string[]
  what_if_scenarios: WhatIfScenario[]
  mentor_summary: string
  next_step: string
}

export interface PlacementAnalysisRequest {
  dsa_score: number
  coding_ability: number
  aptitude_score: number
  verbal_score: number
  ats_score: number
  resume_skill_match: number
  missing_skills: string[]
  internship_score: number
  has_internship: boolean
  project_count: number
  failure_risk: number
  weak_areas: string[]
  consistency_score: number
  study_hours_per_day: number
  mock_interviews_done: number
  target_companies: string[]
  target_role: string
  year: number
}

// --- API Error ---
export interface ApiError {
  status: number
  message: string
}
