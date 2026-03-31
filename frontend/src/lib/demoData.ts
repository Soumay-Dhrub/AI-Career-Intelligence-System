/**
 * Demo data shown on first load before the user runs their first analysis.
 * Gives a realistic preview of what the dashboard looks like with real data.
 */
import type { PlacementReport } from '@/types/api'

export const DEMO_REPORT: PlacementReport = {
  placement_probability: 0.74,
  risk_level: 'Low',
  consistency_score: 0.82,
  burnout_risk: 'Low',
  resume_score: 0.71,
  missing_skills: ['Kubernetes', 'System Design', 'CI/CD', 'Microservices', 'TypeScript'],
  internship_score: 7.25,
  placement_boost: 0.725,
  failure_reasons: [],
  weak_areas: ['Operating Systems', 'Computer Networks'],
  roadmap: [
    {
      skill: 'System Design',
      resources: ['https://github.com/donnemartin/system-design-primer'],
      priority: 1,
    },
    {
      skill: 'Kubernetes',
      resources: ['https://kubernetes.io/docs/tutorials'],
      priority: 2,
    },
    {
      skill: 'CI/CD',
      resources: ['https://www.youtube.com/results?search_query=CI+CD+tutorial'],
      priority: 3,
    },
    {
      skill: 'Microservices',
      resources: ['https://microservices.io/patterns/index.html'],
      priority: 4,
    },
    {
      skill: 'TypeScript',
      resources: ['https://www.typescriptlang.org/docs/'],
      priority: 5,
    },
  ],
}

export const DEMO_CONSISTENCY_DATA = [
  { day: 'Mon', hours: 4.5, score: 0.68 },
  { day: 'Tue', hours: 5.0, score: 0.72 },
  { day: 'Wed', hours: 3.5, score: 0.65 },
  { day: 'Thu', hours: 6.0, score: 0.80 },
  { day: 'Fri', hours: 5.5, score: 0.78 },
  { day: 'Sat', hours: 7.0, score: 0.85 },
  { day: 'Sun', hours: 4.0, score: 0.82 },
]
