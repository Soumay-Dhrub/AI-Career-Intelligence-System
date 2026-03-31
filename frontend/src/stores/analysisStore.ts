import { create } from 'zustand'
import { api } from '@/services/api'
import type { AnalyzeRequest, PlacementReport } from '@/types/api'

interface AnalysisState {
  report: PlacementReport | null
  isLoading: boolean
  error: string | null
  runAnalysis: (payload: AnalyzeRequest) => Promise<void>
  clearReport: () => void
}

const REPORT_KEY = 'analysis_report'

// Rehydrate from sessionStorage on init
function loadReport(): PlacementReport | null {
  try {
    const raw = sessionStorage.getItem(REPORT_KEY)
    if (raw) {
      try {
        return JSON.parse(raw) as PlacementReport
      } catch {
        // corrupted — ignore
      }
    }
  } catch {
    // storage not available
  }
  return null
}

export const useAnalysisStore = create<AnalysisState>()((set) => ({
  report: loadReport(),
  isLoading: false,
  error: null,

  runAnalysis: async (payload: AnalyzeRequest) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.analyze(payload)
      const report = res.data
      sessionStorage.setItem(REPORT_KEY, JSON.stringify(report))
      set({ report, isLoading: false })
    } catch (err: unknown) {
      const message =
        (err as { message?: string }).message ?? 'Analysis failed'
      set({ error: message, isLoading: false })
    }
  },

  clearReport: () => {
    sessionStorage.removeItem(REPORT_KEY)
    set({ report: null, error: null })
  },
}))
