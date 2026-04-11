import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Loader2 } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import { cn, getRiskBgColor } from '@/lib/utils'
import type { BurnoutResponse } from '@/types/api'

export function BurnoutPage() {
  const toast = useToast()
  const [hours, setHours] = useState<number[]>(Array(14).fill(5))
  const [numDays, setNumDays] = useState(14)
  const [result, setResult] = useState<BurnoutResponse | null>(null)
  const [loading, setLoading] = useState(false)

  function handleDaysChange(n: number) {
    setNumDays(n)
    setHours(Array(n).fill(0).map((_, i) => hours[i] ?? 5))
  }

  async function handleSubmit() {
    if (hours.length < 7) { toast.error('Need at least 7 days'); return }
    setLoading(true)
    try {
      const today = new Date()
      const dates = Array.from({ length: numDays }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (numDays - 1 - i))
        return d.toISOString().split('T')[0]
      })
      const res = await api.burnoutAnalysis({ study_log: { daily_hours: hours, dates } })
      setResult(res.data)
      toast.success('Analysis complete!')
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
        <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl">🧠</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Burnout & Consistency</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Analyze your study patterns and burnout risk</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Input card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Study Log Input</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Number of days: <span className="text-purple-600 dark:text-purple-400 font-bold">{numDays}</span>
            </label>
            <input type="range" min={7} max={30} value={numDays}
              onChange={(e) => handleDaysChange(Number(e.target.value))}
              className="w-full accent-purple-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-1"><span>7</span><span>30</span></div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Daily study hours</label>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {hours.map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-400">D{i + 1}</span>
                  <input type="number" min={0} max={24} value={h}
                    onChange={(e) => { const u = [...hours]; u[i] = Number(e.target.value); setHours(u) }}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all" />
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-sm">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
            {loading ? 'Analyzing…' : 'Analyze Burnout Risk'}
          </button>
        </motion.div>

        {/* Result card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Results</h2>
          {!result ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <span className="text-5xl mb-3">🧠</span>
              <p className="text-sm text-slate-400 dark:text-slate-500">Enter your study hours and click Analyze</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Consistency score ring */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide font-medium">Consistency Score</p>
                <p className="text-4xl font-black text-purple-600 dark:text-purple-400">
                  {(result.consistency_score * 100).toFixed(1)}%
                </p>
                <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.consistency_score * 100}%` }}
                    transition={{ duration: 0.8 }} className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide font-medium">Burnout Risk</p>
                <span className={cn('badge text-sm font-bold', getRiskBgColor(result.burnout_risk))}>
                  {result.burnout_risk === 'Low' ? '😊' : result.burnout_risk === 'Medium' ? '😐' : '😰'} {result.burnout_risk} Risk
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {result.burnout_risk === 'Low' ? 'Great! Your study habits are sustainable.' :
                   result.burnout_risk === 'Medium' ? 'Consider taking more breaks.' :
                   'High burnout risk. Reduce study hours and rest more.'}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
