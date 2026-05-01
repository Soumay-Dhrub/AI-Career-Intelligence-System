import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Sparkles, ArrowRight, X } from 'lucide-react'

const STEPS = [
  {
    title: 'Dashboard overview',
    description: 'Your dashboard shows placement readiness, quick insights, and module shortcuts in one view.',
  },
  {
    title: 'Complete your profile',
    description: 'Add your academic details, skills, projects, and target role so recommendations match your background.',
  },
  {
    title: 'Run full analysis',
    description: 'Click Run Analysis to generate your placement score, roadmap, and module-specific results.',
  },
  {
    title: 'Explore Analytics',
    description: 'Check trends and performance data that reveal your strongest and weakest areas.',
  },
  {
    title: 'Open AI modules',
    description: 'Visit Resume, Internship, Failure, Roadmap, and Placement modules for deeper guidance.',
  },
  {
    title: 'Use NextHire AI',
    description: 'Ask the chatbot for resume tips, profile advice, or a study roadmap anytime.',
  },
]

export function OnboardingTour() {
  const { tourOpen, currentStep, closeTour, nextStep, skipTour } = useOnboardingStore()
  const step = STEPS[currentStep]

  return (
    <AnimatePresence>
      {tourOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl rounded-[32px] border border-slate-200/60 bg-white dark:bg-slate-950 shadow-2xl p-6"
          >
            <button
              onClick={skipTour}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Skip tour"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Welcome to PlaceReady</p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick tour for new users</h2>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-slate-50 dark:bg-slate-900/70 p-5 mb-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Step {currentStep + 1} of {STEPS.length}</p>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{step.title}</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{Math.round(((currentStep + 1) / STEPS.length) * 100)}% complete</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400"
                  initial={false}
                  animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{step.description}</p>
              <div className="rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">What to focus on</p>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{step.title === 'Dashboard overview' ? 'Review the score summary, quick actions, and module cards at the top.' : step.title === 'Complete your profile' ? 'Fill in your details so the platform gives you stronger recommendations.' : step.title === 'Run full analysis' ? 'Use the analysis button to generate your report and roadmap.' : step.title === 'Explore Analytics' ? 'Visit Analytics to understand your placement trend and weak points.' : step.title === 'Open AI modules' ? 'Each module gives a targeted view of one career dimension.' : 'Ask the chatbot for fast guidance, career tips, and next steps.'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={skipTour}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Skip tour
              </button>
              <button
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 hover:bg-blue-700 transition"
              >
                {currentStep === STEPS.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
