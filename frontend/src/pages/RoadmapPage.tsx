import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { PlayCircle, Zap } from 'lucide-react'
import { useAnalysisStore } from '@/stores/analysisStore'
import { RoadmapStep } from '@/components/ui/RoadmapStep'
import { AnalyzeModal } from '@/components/forms/AnalyzeModal'
import { DEMO_REPORT } from '@/lib/demoData'

export function RoadmapPage() {
  const report = useAnalysisStore((s) => s.report)
  const isLoading = useAnalysisStore((s) => s.isLoading)
  const [modalOpen, setModalOpen] = useState(false)

  const data = report ?? DEMO_REPORT
  const isDemo = !report
  const sortedRoadmap = [...data.roadmap].sort((a, b) => a.priority - b.priority)

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto">
      {/* Hero image header with blue overlay */}
      <div className="relative rounded-2xl overflow-hidden mb-6 h-36">
        <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80"
          alt="Learning roadmap" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-sky-900/70 flex items-center px-6">
          <div>
            <h1 className="text-2xl font-black text-white">Learning Roadmap 🗺️</h1>
            <p className="text-white/70 text-sm mt-1">Your personalized step-by-step path to placement readiness</p>
          </div>
          {isDemo && (
            <button onClick={() => setModalOpen(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-600 text-sm font-bold hover:shadow-lg transition-all shrink-0">
              <Zap size={14} /> Run Analysis
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
              <div className="flex-1 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && sortedRoadmap.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">🗺️</span>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">No roadmap yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            Run an analysis to generate your personalized learning roadmap.
          </p>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold btn-glow">
            <PlayCircle size={16} /> Run Analysis
          </button>
        </motion.div>
      )}

      {!isLoading && sortedRoadmap.length > 0 && (
        <div>
          {/* Progress summary card */}
          <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/40">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shrink-0">
              {sortedRoadmap.length}
            </div>
            <div>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Skills to master</p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Complete these in order for best results</p>
            </div>
          </div>

          {sortedRoadmap.map((step, i) => (
            <RoadmapStep
              key={`${step.skill}-${step.priority}`}
              skill={step.skill}
              priority={step.priority}
              resources={step.resources}
              isTop={step.priority === 1}
              animationDelay={i * 0.1}
              data-testid="roadmap-step"
              data-priority={step.priority}
            />
          ))}
        </div>
      )}

      <AnalyzeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
