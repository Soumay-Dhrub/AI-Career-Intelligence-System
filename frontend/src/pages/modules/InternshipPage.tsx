import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Loader2 } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'
import type { InternshipResponse } from '@/types/api'

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 dark:focus:border-green-400 transition-all duration-200'

export function InternshipPage() {
  const toast = useToast()
  const [form, setForm] = useState({ duration_months: 6, company_tier: 2, role_relevance: 0.7, project_count: 2 })
  const [result, setResult] = useState<InternshipResponse | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await api.internshipAnalysis(form)
      setResult(res.data)
      toast.success('Internship scored!')
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xl">💼</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Internship Predictor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Evaluate how your internship impacts placement chances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Input card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Internship Details</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Duration (months)</label>
            <input type="number" min={0} max={24} value={form.duration_months}
              onChange={(e) => setForm(f => ({ ...f, duration_months: Number(e.target.value) }))}
              className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Company Tier</label>
            <div className="flex gap-3">
              {[1, 2, 3].map((tier) => (
                <label key={tier} className={cn(
                  'flex-1 flex items-center justify-center py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium',
                  form.company_tier === tier
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                )}>
                  <input type="radio" name="tier" value={tier} checked={form.company_tier === tier}
                    onChange={() => setForm(f => ({ ...f, company_tier: tier }))} className="hidden" />
                  Tier {tier}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Role Relevance: <span className="text-green-600 dark:text-green-400 font-bold">{form.role_relevance.toFixed(2)}</span>
            </label>
            <input type="range" min={0} max={1} step={0.01} value={form.role_relevance}
              onChange={(e) => setForm(f => ({ ...f, role_relevance: Number(e.target.value) }))}
              className="w-full accent-green-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0</span><span>1</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Count</label>
            <input type="number" min={0} value={form.project_count}
              onChange={(e) => setForm(f => ({ ...f, project_count: Number(e.target.value) }))}
              className={inputCls} />
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-sm">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Briefcase size={16} />}
            {loading ? 'Scoring…' : 'Score Internship'}
          </button>
        </motion.div>

        {/* Result card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Results</h2>
          {!result ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <span className="text-5xl mb-3">💼</span>
              <p className="text-sm text-slate-400 dark:text-slate-500">Fill in your internship details and click Score</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                <p className="section-label mb-2">Internship Score</p>
                <p className="text-4xl font-black text-green-600 dark:text-green-400">
                  {result.internship_score.toFixed(1)}<span className="text-lg text-slate-400">/10</span>
                </p>
                <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.internship_score * 10}%` }}
                    transition={{ duration: 0.8 }} className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                <p className="section-label mb-2">Placement Boost</p>
                <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                  +{(result.placement_boost * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-slate-400 mt-1">Boost to your placement probability</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
