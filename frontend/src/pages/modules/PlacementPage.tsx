import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { PlayCircle } from 'lucide-react'
import { useAnalysisStore } from '@/stores/analysisStore'
import { AnalyzeModal } from '@/components/forms/AnalyzeModal'
import { cn, formatPercent } from '@/lib/utils'
import { DEMO_REPORT } from '@/lib/demoData'

export function PlacementPage() {
  const report = useAnalysisStore((s) => s.report)
  const [modalOpen, setModalOpen] = useState(false)

  const data = report ?? DEMO_REPORT
  const isDemo = !report

  const factors = [
    { label: 'Study Consistency', value: data.consistency_score, color: 'bg-purple-500' },
    { label: 'Resume Quality', value: data.resume_score, color: 'bg-blue-500' },
    { label: 'Internship Score', value: data.internship_score / 10, color: 'bg-green-500' },
    { label: 'Placement Boost', value: data.placement_boost, color: 'bg-teal-500' },
  ]

  const circumference = 2 * Math.PI * 54
  const strokeDash = circumference * data.placement_probability

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">🎯</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Placement Predictor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your final placement probability based on all modules</p>
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="mb-5 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-between gap-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">✨ Showing sample data — run analysis for real results</p>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shrink-0">
            <PlayCircle size={13} /> Run Analysis
          </button>
        </div>
      )}

      {/* Big probability card with circular ring */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden shadow-sm mb-5">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-sky-700 p-8 text-white">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            {/* Circular ring */}
            <div className="relative w-36 h-36 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="white" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - strokeDash }}
                  transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-black text-white leading-none">{Math.round(data.placement_probability * 100)}%</p>
                <p className="text-xs text-white/60 mt-0.5">Ready</p>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-white/60 text-sm mb-1">Placement Probability</p>
              <p className="text-5xl font-black text-white mb-3">{formatPercent(data.placement_probability)}</p>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border',
                data.risk_level === 'Low' ? 'bg-green-400/20 border-green-300/40 text-green-100' :
                data.risk_level === 'Medium' ? 'bg-yellow-400/20 border-yellow-300/40 text-yellow-100' :
                'bg-red-400/20 border-red-300/40 text-red-100'
              )}>
                {data.risk_level === 'Low' ? '✅' : data.risk_level === 'Medium' ? '⚠️' : '🚨'} {data.risk_level} Risk
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-white/50 mb-1.5">
              <span>Placement Readiness</span>
              <span>{formatPercent(data.placement_probability)}</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${data.placement_probability * 100}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                className="h-full bg-white rounded-full" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contributing factors */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 mb-4">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Contributing Factors</h2>
        <div className="space-y-3">
          {factors.map((f, i) => (
            <div key={f.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-600 dark:text-slate-400">{f.label}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{(f.value * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${f.value * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                  className={`h-full rounded-full ${f.color}`} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {!isDemo && (
        <button onClick={() => setModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold btn-glow transition-all">
          <PlayCircle size={16} /> Re-run Full Analysis
        </button>
      )}

      <AnalyzeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
