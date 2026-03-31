import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Navigation, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'
import type { RoadmapResponse } from '@/types/api'

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 dark:focus:border-teal-400 transition-all duration-200'

export function RoadmapToolPage() {
  const toast = useToast()
  const [currentSkills, setCurrentSkills] = useState('Python, React, SQL')
  const [targetSkills, setTargetSkills] = useState('Docker, Kubernetes, System Design')
  const [targetRole, setTargetRole] = useState('Backend Engineer')
  const [result, setResult] = useState<RoadmapResponse | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    const target = targetSkills.split(',').map(s => s.trim()).filter(Boolean)
    if (target.length === 0) { toast.error('Enter at least one target skill'); return }
    setLoading(true)
    try {
      const res = await api.roadmapGeneration({
        current_skills: currentSkills.split(',').map(s => s.trim()).filter(Boolean),
        target_skills: target,
        target_role: targetRole,
      })
      setResult(res.data)
      toast.success('Roadmap generated!')
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xl">🗺️</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Roadmap Generator</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Get a personalized learning path based on your skill gaps</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Input card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Skill Gap Input</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Skills (comma-separated)</label>
            <input type="text" value={currentSkills} onChange={(e) => setCurrentSkills(e.target.value)}
              placeholder="Python, React, SQL..." className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Skills (comma-separated)</label>
            <input type="text" value={targetSkills} onChange={(e) => setTargetSkills(e.target.value)}
              placeholder="Docker, Kubernetes..." className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Role</label>
            <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Software Engineer..." className={inputCls} />
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-sm">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
            {loading ? 'Generating…' : 'Generate Roadmap'}
          </button>
        </motion.div>

        {/* Result card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 overflow-y-auto max-h-[480px]">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Your Roadmap</h2>
          {!result ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <span className="text-5xl mb-3">🗺️</span>
              <p className="text-sm text-slate-400 dark:text-slate-500">Enter your skills and generate a roadmap</p>
            </div>
          ) : result.roadmap.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">You already have all target skills!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {result.roadmap.sort((a, b) => a.priority - b.priority).map((step, i) => (
                <motion.div key={step.skill} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    'p-3 rounded-xl border',
                    step.priority === 1
                      ? 'border-teal-400 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                  )}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      step.priority === 1 ? 'bg-teal-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    )}>
                      {step.priority}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.skill}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 ml-8">
                    {step.resources.map((r, ri) => (
                      <a key={ri} href={r} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium">
                        <ExternalLink size={11} /> Resource {ri + 1}
                      </a>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
