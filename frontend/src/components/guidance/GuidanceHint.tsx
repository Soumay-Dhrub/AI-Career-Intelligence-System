import React from 'react'
import { Sparkles, HelpCircle } from 'lucide-react'
import { useOnboardingStore } from '@/stores/onboardingStore'

interface GuidanceHintProps {
  title: string
  description: string
}

export function GuidanceHint({ title, description }: GuidanceHintProps) {
  const openHelp = useOnboardingStore((s) => s.openHelp)
  const openTour = useOnboardingStore((s) => s.openTour)

  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50 dark:bg-slate-950/80 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-sm">
          <Sparkles size={18} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{description}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={openTour}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition">
              <Sparkles size={14} /> Start guided tour
            </button>
            <button onClick={openHelp}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <HelpCircle size={14} /> Open help panel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
