import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'placeReady_onboarding_complete'

export interface OnboardingState {
  tourOpen: boolean
  helpOpen: boolean
  currentStep: number
  complete: boolean
  loading: boolean
  loadState: () => Promise<void>
  openHelp: () => void
  closeHelp: () => void
  openTour: () => void
  closeTour: () => void
  nextStep: () => void
  skipTour: () => Promise<void>
  completeTour: () => Promise<void>
  resetTour: () => Promise<void>
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  tourOpen: false,
  helpOpen: false,
  currentStep: 0,
  complete: false,
  loading: true,

  loadState: async () => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const localValue = localStorage.getItem(STORAGE_KEY) === 'true'
      const authValue = !!user?.user_metadata?.onboarding_complete
      const complete = localValue || authValue
      set({ complete, tourOpen: false, currentStep: 0, loading: false })
    } catch (err) {
      set({ complete: false, tourOpen: false, currentStep: 0, loading: false })
    }
  },

  openHelp: () => set({ helpOpen: true }),
  closeHelp: () => set({ helpOpen: false }),
  openTour: () => set({ tourOpen: true, currentStep: 0, helpOpen: false }),
  closeTour: () => set({ tourOpen: false }),

  nextStep: () => {
    const currentStep = get().currentStep
    const steps = 6
    if (currentStep >= steps - 1) {
      get().completeTour()
      return
    }
    set({ currentStep: currentStep + 1 })
  },

  skipTour: async () => {
    await get().completeTour()
    set({ tourOpen: false })
  },

  completeTour: async () => {
    set({ complete: true, tourOpen: false })
    localStorage.setItem(STORAGE_KEY, 'true')
    try {
      await supabase.auth.updateUser({ data: { onboarding_complete: true } })
    } catch {
      // Non-blocking: keep local state even if metadata update fails.
    }
  },

  resetTour: async () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ complete: false, tourOpen: true, currentStep: 0 })
    try {
      await supabase.auth.updateUser({ data: { onboarding_complete: false } })
    } catch {
      // ignore failures
    }
  },
}))
