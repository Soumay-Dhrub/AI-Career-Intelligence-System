// @vitest-environment jsdom
// Feature: placement-readiness-dashboard
// Property 2: Login stores token in correct storage based on remember-me flag
// Property 14: isLoading transitions correctly for both success and failure paths
// Property 19: AuthStore.logout() clears all auth state and storage keys
// Property 20: AnalysisStore persists last successful report to sessionStorage

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import fc from 'fast-check'
import { act, renderHook } from '@testing-library/react'

// We test store logic directly (not via React hooks) to keep tests simple
import { useAuthStore } from '@/stores/authStore'
import { useAnalysisStore } from '@/stores/analysisStore'
import type { PlacementReport, LoginResponse } from '@/types/api'
import * as apiModule from '@/services/api'

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'
const REPORT_KEY = 'analysis_report'

function makePlacementReport(overrides: Partial<PlacementReport> = {}): PlacementReport {
  return {
    placement_probability: 0.75,
    risk_level: 'Low',
    consistency_score: 0.8,
    burnout_risk: 'Low',
    resume_score: 0.7,
    missing_skills: ['Docker'],
    internship_score: 7.5,
    placement_boost: 0.6,
    failure_reasons: [],
    weak_areas: [],
    roadmap: [],
    ...overrides,
  }
}

describe('Store property tests', () => {
  beforeEach(() => {
    // jsdom localStorage may not have .clear() — use removeItem for known keys
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_user')
    sessionStorage.removeItem('analysis_report')
    // Reset stores to initial state
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
    useAnalysisStore.setState({ report: null, isLoading: false, error: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Property 2: Login stores token in correct storage based on remember-me flag
  it('Property 2: login stores token in localStorage when remember=true, sessionStorage when false', async () => {
    // Validates: Requirements 1.2, 1.6
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10 }),
        fc.boolean(),
        fc.record({ name: fc.string({ minLength: 1 }), email: fc.emailAddress() }),
        async (token, remember, user) => {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          sessionStorage.removeItem('auth_token')
          sessionStorage.removeItem('auth_user')
          useAuthStore.setState({ user: null, token: null, isAuthenticated: false })

          const mockResponse: LoginResponse = { token, user }
          vi.spyOn(apiModule.authApi, 'login').mockResolvedValueOnce({
            data: mockResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as never,
          })

          await act(async () => {
            await useAuthStore.getState().login({ email: user.email, password: 'pass' }, remember)
          })

          if (remember) {
            expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe(token)
            expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
          } else {
            expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe(token)
            expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
          }

          expect(useAuthStore.getState().isAuthenticated).toBe(true)
          expect(useAuthStore.getState().token).toBe(token)
        }
      ),
      { numRuns: 50 }
    )
  })

  // Property 19: AuthStore.logout() clears all auth state and storage keys
  it('Property 19: logout clears all auth state and storage keys', () => {
    // Validates: Requirements 15.3
    fc.assert(
      fc.property(
        fc.string({ minLength: 10 }),
        fc.record({ name: fc.string({ minLength: 1 }), email: fc.emailAddress() }),
        fc.boolean(),
        (token, user, inLocal) => {
          // Set up state
          const storage = inLocal ? localStorage : sessionStorage
          storage.setItem(AUTH_TOKEN_KEY, token)
          storage.setItem(AUTH_USER_KEY, JSON.stringify(user))
          useAuthStore.setState({ user, token, isAuthenticated: true })

          useAuthStore.getState().logout()

          expect(useAuthStore.getState().user).toBeNull()
          expect(useAuthStore.getState().token).toBeNull()
          expect(useAuthStore.getState().isAuthenticated).toBe(false)
          expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
          expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull()
          expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull()
          expect(sessionStorage.getItem(AUTH_USER_KEY)).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property 14: isLoading transitions correctly for both success and failure paths
  it('Property 14: isLoading is true during request and false after (success)', async () => {
    // Validates: Requirements 11.1, 15.4
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          placement_probability: fc.float({ min: 0, max: 1 }),
          risk_level: fc.constantFrom('Low' as const, 'Medium' as const, 'High' as const),
        }),
        async (partial) => {
          useAnalysisStore.setState({ report: null, isLoading: false, error: null })
          sessionStorage.removeItem('analysis_report')

          const report = makePlacementReport(partial)
          let resolveAnalysis!: (value: unknown) => void
          const analysisPromise = new Promise((res) => { resolveAnalysis = res })

          vi.spyOn(apiModule.api, 'analyze').mockReturnValueOnce(
            analysisPromise.then(() => ({
              data: report,
              status: 200,
              statusText: 'OK',
              headers: {},
              config: {} as never,
            }))
          )

          const runPromise = act(async () => {
            void useAnalysisStore.getState().runAnalysis({
              study_log: { daily_hours: [8], dates: ['2024-01-01'] },
              resume_text: 'text',
              job_description: 'desc',
              internship: { duration_months: 3, company_tier: 1, role_relevance: 0.8, project_count: 2 },
              performance: { subject_scores: [], backlogs: 0, project_failures: 0 },
              skill_gap: { current_skills: [], target_skills: [], target_role: 'SWE' },
            })
          })

          // isLoading should be true while in-flight
          expect(useAnalysisStore.getState().isLoading).toBe(true)

          // Resolve the API call
          await act(async () => {
            resolveAnalysis(undefined)
            await runPromise
          })

          expect(useAnalysisStore.getState().isLoading).toBe(false)
          expect(useAnalysisStore.getState().report).toEqual(report)
        }
      ),
      { numRuns: 30 }
    )
  })

  it('Property 14: isLoading is false after failure', async () => {
    // Validates: Requirements 11.1, 15.4
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (errorMessage) => {
          useAnalysisStore.setState({ report: null, isLoading: false, error: null })

          vi.spyOn(apiModule.api, 'analyze').mockRejectedValueOnce({
            status: 500,
            message: errorMessage,
          })

          await act(async () => {
            await useAnalysisStore.getState().runAnalysis({
              study_log: { daily_hours: [8], dates: ['2024-01-01'] },
              resume_text: 'text',
              job_description: 'desc',
              internship: { duration_months: 3, company_tier: 1, role_relevance: 0.8, project_count: 2 },
              performance: { subject_scores: [], backlogs: 0, project_failures: 0 },
              skill_gap: { current_skills: [], target_skills: [], target_role: 'SWE' },
            })
          })

          expect(useAnalysisStore.getState().isLoading).toBe(false)
          expect(useAnalysisStore.getState().error).toBeTruthy()
        }
      ),
      { numRuns: 50 }
    )
  })

  // Property 20: AnalysisStore persists last successful report to sessionStorage
  it('Property 20: successful runAnalysis persists report to sessionStorage', async () => {
    // Validates: Requirements 15.5
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          placement_probability: fc.float({ min: 0, max: 1 }),
          risk_level: fc.constantFrom('Low' as const, 'Medium' as const, 'High' as const),
          missing_skills: fc.array(fc.string({ minLength: 1 }), { maxLength: 5 }),
        }),
        async (partial) => {
          useAnalysisStore.setState({ report: null, isLoading: false, error: null })
          sessionStorage.removeItem('analysis_report')

          const report = makePlacementReport(partial)
          vi.spyOn(apiModule.api, 'analyze').mockResolvedValueOnce({
            data: report,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as never,
          })

          await act(async () => {
            await useAnalysisStore.getState().runAnalysis({
              study_log: { daily_hours: [8], dates: ['2024-01-01'] },
              resume_text: 'text',
              job_description: 'desc',
              internship: { duration_months: 3, company_tier: 1, role_relevance: 0.8, project_count: 2 },
              performance: { subject_scores: [], backlogs: 0, project_failures: 0 },
              skill_gap: { current_skills: [], target_skills: [], target_role: 'SWE' },
            })
          })

          const stored = sessionStorage.getItem(REPORT_KEY)
          expect(stored).not.toBeNull()
          expect(JSON.parse(stored!)).toEqual(report)
        }
      ),
      { numRuns: 50 }
    )
  })
})
