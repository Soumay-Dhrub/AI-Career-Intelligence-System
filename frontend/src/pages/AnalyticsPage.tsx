import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, XCircle, Zap } from 'lucide-react'
import { useAnalysisStore } from '@/stores/analysisStore'
import { SkillChip } from '@/components/ui/SkillChip'
import { Skeleton } from '@/components/ui/Skeleton'
import { InternshipBarChart } from '@/components/charts/InternshipBarChart'
import { AnalyzeModal } from '@/components/forms/AnalyzeModal'
import { cn } from '@/lib/utils'
import { DEMO_REPORT } from '@/lib/demoData'

export function AnalyticsPage() {
  const report = useAnalysisStore((s) => s.report)
  const isLoading = useAnalysisStore((s) => s.isLoading)
  const [modalOpen, setModalOpen] = useState(false)

  const data = report ?? DEMO_REPORT
  const isDemo = !report

  return (
    <div className="p-5 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Deep dive into your placement readiness</p>
        </div>
        {isDemo && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
            <span className="badge bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">Preview</span>
            <button onClick={() => setModalOpen(true)} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <Zap size={11} /> Run Analysis
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-5">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && (
        <div className="space-y-5">
          {/* Burnout card — full width gradient */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden shadow-sm">
            <div className={cn('p-6',
              data.burnout_risk === 'Low' ? 'bg-gradient-to-r from-emerald-500 to-green-600' :
              data.burnout_risk === 'Medium' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
              'bg-gradient-to-r from-red-500 to-rose-600'
            )}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                    {data.burnout_risk === 'Low' ? '😊' : data.burnout_risk === 'Medium' ? '😐' : '😰'}
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium mb-0.5 uppercase tracking-wide">Burnout Risk Level</p>
                    <p className="text-2xl font-black text-white">{data.burnout_risk}</p>
                    <p className="text-white/80 text-sm mt-0.5">
                      {data.burnout_risk === 'Low' ? 'Your study habits are sustainable. Keep it up!' :
                       data.burnout_risk === 'Medium' ? 'Consider balancing your schedule to avoid burnout.' :
                       'High burnout risk. Take breaks and reassess your routine.'}
                    </p>
                  </div>
                </div>
                <div className="glass rounded-xl px-5 py-3 text-center">
                  <p className="text-2xl font-black text-white">{(data.consistency_score * 100).toFixed(0)}%</p>
                  <p className="text-xs text-white/60 mt-0.5">Consistency</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Weak areas + Missing skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle size={14} className="text-amber-500" />
                </div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Weak Areas</h2>
                <span className="ml-auto badge bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  {data.weak_areas.length}
                </span>
              </div>
              {data.weak_areas.length === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">No weak areas detected!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {data.weak_areas.map((area) => (
                    <div key={area} className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 text-xs font-semibold text-amber-700 dark:text-amber-400 text-center">
                      {area}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-sm">🎯</span>
                </div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Missing Skills</h2>
                <span className="ml-auto badge bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {data.missing_skills.length}
                </span>
              </div>
              {data.missing_skills.length === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">All target skills covered!</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.missing_skills.map((skill) => <SkillChip key={skill} skill={skill} variant="missing" />)}
                </div>
              )}
            </motion.div>
          </div>

          {/* Internship impact chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm">💼</div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Internship Impact</h2>
            </div>
            <InternshipBarChart internshipScore={data.internship_score} placementBoost={data.placement_boost} />
          </motion.div>

          {/* Risk factors */}
          {data.failure_reasons.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-2xl border border-red-200/60 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={15} className="text-red-500" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Risk Factors</h2>
              </div>
              <ul className="space-y-2">
                {data.failure_reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <XCircle size={13} className="text-red-400 mt-0.5 shrink-0" />{reason}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Motivational image banner */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl overflow-hidden shadow-sm relative h-40">
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80"
              alt="Students studying" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent flex items-center p-6">
              <div>
                <p className="text-white font-black text-lg">Keep pushing forward! 🚀</p>
                <p className="text-white/70 text-sm mt-1">Every skill you learn brings you closer to your dream placement.</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <AnalyzeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
