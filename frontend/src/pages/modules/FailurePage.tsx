import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader2, Plus, Trash2, XCircle, CheckCircle2 } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import type { FailureResponse } from '@/types/api'

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-400 transition-all duration-200'

export function FailurePage() {
  const toast = useToast()
  const [subjects, setSubjects] = useState([{ subject: 'Mathematics', score: 75 }, { subject: 'Computer Science', score: 82 }])
  const [backlogs, setBacklogs] = useState(0)
  const [projectFailures, setProjectFailures] = useState(0)
  const [result, setResult] = useState<FailureResponse | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (subjects.length === 0) { toast.error('Add at least one subject'); return }
    setLoading(true)
    try {
      const res = await api.failureAnalysis({ subject_scores: subjects, backlogs, project_failures: projectFailures })
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
        <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xl">🔍</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Failure Analysis</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Identify weak areas from your academic performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Input card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Subject Scores</h2>
            <button onClick={() => setSubjects(s => [...s, { subject: '', score: 75 }])}
              className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium">
              <Plus size={13} /> Add Subject
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {subjects.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" placeholder="Subject" value={s.subject}
                  onChange={(e) => { const u = [...subjects]; u[i] = { ...u[i], subject: e.target.value }; setSubjects(u) }}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all" />
                <input type="number" min={0} max={100} value={s.score}
                  onChange={(e) => { const u = [...subjects]; u[i] = { ...u[i], score: Number(e.target.value) }; setSubjects(u) }}
                  className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all" />
                <button onClick={() => setSubjects(s => s.filter((_, idx) => idx !== i))}
                  className="text-red-400 hover:text-red-600 p-1 transition-colors"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Backlogs</label>
              <input type="number" min={0} value={backlogs} onChange={(e) => setBacklogs(Number(e.target.value))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Project Failures</label>
              <input type="number" min={0} value={projectFailures} onChange={(e) => setProjectFailures(Number(e.target.value))}
                className={inputCls} />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-sm">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
            {loading ? 'Analyzing…' : 'Analyze Failures'}
          </button>
        </motion.div>

        {/* Result card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Results</h2>
          {!result ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <span className="text-5xl mb-3">🔍</span>
              <p className="text-sm text-slate-400 dark:text-slate-500">Enter your performance data and click Analyze</p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.weak_areas.length > 0 && (
                <div>
                  <p className="section-label mb-2">Weak Areas</p>
                  <div className="grid grid-cols-2 gap-2">
                    {result.weak_areas.map((a) => (
                      <span key={a} className="px-3 py-2 rounded-xl text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 text-center">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.failure_reasons.length > 0 ? (
                <div>
                  <p className="section-label mb-2">Risk Factors</p>
                  <ul className="space-y-1.5">
                    {result.failure_reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <XCircle size={13} className="text-red-400 mt-0.5 shrink-0" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">No major risk factors detected!</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
