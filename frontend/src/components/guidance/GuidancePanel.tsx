import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { HelpCircle, Sparkles, FileText, Briefcase, AlertTriangle, Navigation, Target, MessageSquare, ArrowRight } from 'lucide-react'

const MODULES = [
  { title: 'Resume Analyzer', description: 'Upload your resume and job description to get ATS score, keyword match, and improvement advice.', icon: FileText },
  { title: 'Internship Predictor', description: 'Evaluate internship quality and understand how it boosts your placement readiness.', icon: Briefcase },
  { title: 'Failure Intelligence', description: 'Identify weak academic areas and recovery steps for better placement outcomes.', icon: AlertTriangle },
  { title: 'Roadmap Generator', description: 'Build a step-by-step learning plan to address gaps and improve your readiness.', icon: Navigation },
  { title: 'Placement Predictor', description: 'See your overall placement probability and what to improve before applying.', icon: Target },
  { title: 'NextHire AI', description: 'Ask the chatbot for resume tips, profile advice, and career-growth guidance.', icon: MessageSquare },
]

export function GuidancePanel() {
  const { helpOpen, closeHelp, openTour } = useOnboardingStore()

  return (
    <AnimatePresence>
      {helpOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl rounded-[28px] bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between gap-4 p-6 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-3xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-lg">
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Platform guide</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Find your way around PlaceReady, understand key modules, and get started fast.</p>
                </div>
              </div>
              <button onClick={closeHelp}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-[1.7fr_1fr]">
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">How the system works</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    PlaceReady analyzes your profile, resume, internships, academic performance and career goals to generate a clear placement readiness score, a personalized roadmap, and AI-powered advice.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Quick start</p>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li>1. Complete your profile for better recommendations.</li>
                    <li>2. Run full analysis to generate your placement score.</li>
                    <li>3. Review module insights and analytics.</li>
                    <li>4. Follow the roadmap to close skill gaps.</li>
                    <li>5. Re-run analysis after improvements.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Start here</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    <p>• Complete your student profile and skill list.</p>
                    <p>• Run the full analysis from Dashboard.</p>
                    <p>• Visit each module for detailed action items.</p>
                    <p>• Ask NextHire AI for instant advice.</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {MODULES.map((module) => {
                    const Icon = module.icon
                    return (
                      <div key={module.title} className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-300">
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{module.title}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{module.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 p-5 mt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Ready for your next step?</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start the interactive tour to learn how each module improves your placement readiness.</p>
                  </div>
                  <button onClick={() => { openTour(); closeHelp() }}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
                    <ArrowRight size={16} /> Start guided tour
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
