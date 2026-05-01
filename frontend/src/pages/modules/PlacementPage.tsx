import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayCircle, Loader2, ChevronRight, ChevronLeft,
  TrendingUp, AlertTriangle, CheckCircle2, Target,
  Lightbulb, Zap, BarChart2, X, ExternalLink,
} from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import { useNotify } from '@/hooks/useNotify'
import { GuidanceHint } from '@/components/guidance/GuidanceHint'
import { cn } from '@/lib/utils'
import type {
  PlacementPrediction, PlacementAnalysisRequest,
  PriorityAction, WhatIfScenario, CompanyReadinessItem,
} from '@/types/api'

// ── Constants ─────────────────────────────────────────────────────────────────
const READINESS_CONFIG = {
  'Not Ready':         { color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/20',     bar: 'bg-red-500',     ring: '#ef4444' },
  'Needs Improvement': { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', bar: 'bg-amber-500',   ring: '#f59e0b' },
  'Almost Ready':      { color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/20',   bar: 'bg-blue-500',    ring: '#3b82f6' },
  'Ready':             { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-500', ring: '#10b981' },
}
const EFFORT_COLOR = { low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400', medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', high: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }
const STEPS = ['Core Skills', 'Resume & Projects', 'Experience', 'Goals']

// ── Sub-components ────────────────────────────────────────────────────────────
function ScoreRing({ score, label, ringColor, size = 140 }: { score: number; label: string; ringColor: string; size?: number }) {
  const r = size * 0.38; const circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth={size*0.07} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={ringColor} strokeWidth={size*0.07} strokeLinecap="round"
            strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - (score / 100) * circ }}
            transition={{ duration: 1.2, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-slate-900 dark:text-white" style={{ fontSize: size * 0.20 }}>{score.toFixed(0)}</span>
          <span className="text-slate-400" style={{ fontSize: size * 0.085 }}>/100</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</span>
    </div>
  )
}

function ModuleBar({ label, score, color, weight }: { label: string; score: number; color: string; weight: string }) {
  const barColor = score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-400">{label} <span className="text-slate-400">({weight})</span></span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">{score.toFixed(0)}</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.7 }}
          className={cn('h-full rounded-full', barColor)} />
      </div>
    </div>
  )
}

function ActionCard({ action, index }: { action: PriorityAction; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-black text-blue-700 dark:text-blue-400 shrink-0">{action.rank}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">{action.action}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{action.impact}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', EFFORT_COLOR[action.effort])}>{action.effort} effort</span>
            <span className="text-xs text-slate-400">{action.timeline}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function WhatIfCard({ scenario, index }: { scenario: WhatIfScenario; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{scenario.scenario}</p>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-lg font-black text-slate-400">{scenario.current_score.toFixed(0)}</span>
        <span className="text-slate-300 dark:text-slate-600">→</span>
        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{scenario.projected_score.toFixed(0)}</span>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">+{scenario.delta.toFixed(1)}</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
        <span className="text-teal-500 shrink-0 mt-0.5">→</span>{scenario.action}
      </p>
    </motion.div>
  )
}

function CompanyCard({ item, index }: { item: CompanyReadinessItem; index: number }) {
  const barColor = item.ready ? 'bg-emerald-500' : item.readiness_pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.company}</p>
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold', item.ready ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
          {item.ready ? '✓ Ready' : `${item.readiness_pct.toFixed(0)}%`}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
        <motion.div initial={{ width: 0 }} animate={{ width: `${item.readiness_pct}%` }} transition={{ duration: 0.7 }}
          className={cn('h-full rounded-full', barColor)} />
      </div>
      {item.missing_skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {item.missing_skills.map(s => <span key={s} className="px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">✗ {s}</span>)}
        </div>
      )}
      {!item.ready && <p className="text-xs text-slate-400">{item.prep_weeks} weeks prep needed</p>}
    </motion.div>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
            i < current ? 'bg-blue-500 text-white' : i === current ? 'bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && <div className={cn('flex-1 h-0.5 rounded', i < current ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700')} />}
        </React.Fragment>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const DEFAULT_INP: PlacementAnalysisRequest = {
  dsa_score: 50, coding_ability: 50, aptitude_score: 50, verbal_score: 50,
  ats_score: 50, resume_skill_match: 50, missing_skills: [],
  internship_score: 5, has_internship: false, project_count: 1,
  failure_risk: 50, weak_areas: [],
  consistency_score: 0.5, study_hours_per_day: 3, mock_interviews_done: 0,
  target_companies: [], target_role: 'Software Engineer', year: 3,
}

export function PlacementPage() {
  const toast = useToast()
  const notify = useNotify()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PlacementPrediction | null>(null)
  const [inp, setInp] = useState<PlacementAnalysisRequest>(DEFAULT_INP)
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'companies' | 'whatif'>('overview')
  const [companyInput, setCompanyInput] = useState('')
  const [skillInput, setSkillInput] = useState('')

  function update<K extends keyof PlacementAnalysisRequest>(key: K, val: PlacementAnalysisRequest[K]) {
    setInp(p => ({ ...p, [key]: val }))
  }

  async function handlePredict() {
    setLoading(true)
    try {
      const res = await api.placementPredict(inp)
      setResult(res.data)
      toast.success('Prediction complete!')
      notify.moduleComplete('Placement Predictor')
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all'

  function RatingRow({ label, field, color = 'accent-blue-500' }: { label: string; field: keyof PlacementAnalysisRequest; color?: string }) {
    const val = inp[field] as number
    const textColor = val >= 70 ? 'text-emerald-600' : val >= 50 ? 'text-amber-600' : 'text-red-500'
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">{label}</span>
          <span className={cn('font-bold tabular-nums', textColor)}>{val.toFixed(0)}/100</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={val}
          onChange={e => update(field, Number(e.target.value))} className={cn('w-full', color)} />
      </div>
    )
  }

  const cfg = result ? READINESS_CONFIG[result.readiness_level] : null

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">🎯</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Placement Predictor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Multi-module AI analysis — your real placement readiness score</p>
        </div>
      </div>

      <GuidanceHint
        title="Understand your placement readiness"
        description="Open the help panel for best practices and follow the guided tour to interpret your readiness score."
      />

      {!result && <StepIndicator current={step} total={STEPS.length} />}

      <AnimatePresence mode="wait">
        {/* ── Step 0: Core Skills ── */}
        {!result && step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><BarChart2 size={15} className="text-blue-500" /> Core Assessment</h2>
            <div className="space-y-4">
              <RatingRow label="DSA & Problem Solving" field="dsa_score" />
              <RatingRow label="Coding Ability" field="coding_ability" />
              <RatingRow label="Aptitude" field="aptitude_score" />
              <RatingRow label="Verbal / Communication" field="verbal_score" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Year of Study</label>
              <div className="flex gap-2">
                {[1,2,3,4].map(y => (
                  <button key={y} onClick={() => update('year', y)}
                    className={cn('flex-1 py-2 rounded-lg text-sm font-semibold border transition-all',
                      inp.year === y ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400')}>
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all">
              Next <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ── Step 1: Resume & Projects ── */}
        {!result && step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Target size={15} className="text-blue-500" /> Resume & Projects</h2>
            <div className="space-y-4">
              <RatingRow label="Resume ATS Score" field="ats_score" />
              <RatingRow label="Skill Match %" field="resume_skill_match" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Projects Built: <span className="text-blue-600 dark:text-blue-400 font-bold">{inp.project_count}</span>
              </label>
              <input type="range" min={0} max={10} step={1} value={inp.project_count}
                onChange={e => update('project_count', Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Missing Skills (comma-separated)</label>
              <input type="text" value={inp.missing_skills.join(', ')}
                onChange={e => update('missing_skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Docker, Kubernetes, System Design" className={inputCls} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><ChevronLeft size={15} /> Back</button>
              <button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all">Next <ChevronRight size={16} /></button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Experience ── */}
        {!result && step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><TrendingUp size={15} className="text-blue-500" /> Experience & Behavior</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Internship Score (0–10): <span className="text-blue-600 dark:text-blue-400 font-bold">{inp.internship_score.toFixed(1)}</span>
              </label>
              <input type="range" min={0} max={10} step={0.5} value={inp.internship_score}
                onChange={e => update('internship_score', Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <input type="checkbox" id="intern" checked={inp.has_internship}
                onChange={e => update('has_internship', e.target.checked)} className="w-4 h-4 accent-blue-500" />
              <label htmlFor="intern" className="text-sm text-slate-700 dark:text-slate-300 font-medium">I have internship experience</label>
            </div>
            <div className="space-y-4">
              <RatingRow label="Failure Risk (higher = more risk)" field="failure_risk" color="accent-red-500" />
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Study Consistency: <span className="text-blue-600 dark:text-blue-400 font-bold">{(inp.consistency_score * 100).toFixed(0)}%</span>
                </label>
                <input type="range" min={0} max={1} step={0.05} value={inp.consistency_score}
                  onChange={e => update('consistency_score', Number(e.target.value))} className="w-full accent-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Mock Interviews Done: <span className="text-blue-600 dark:text-blue-400 font-bold">{inp.mock_interviews_done}</span>
                </label>
                <input type="range" min={0} max={30} step={1} value={inp.mock_interviews_done}
                  onChange={e => update('mock_interviews_done', Number(e.target.value))} className="w-full accent-blue-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><ChevronLeft size={15} /> Back</button>
              <button onClick={() => setStep(3)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all">Next <ChevronRight size={16} /></button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Goals ── */}
        {!result && step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"><Target size={15} className="text-blue-500" /> Goals</h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Target Role</label>
              <input type="text" value={inp.target_role} onChange={e => update('target_role', e.target.value)}
                placeholder="Software Engineer, Data Scientist..." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Target Companies (optional)</label>
              <div className="flex gap-2 mb-2">
                <input value={companyInput} onChange={e => setCompanyInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && companyInput.trim()) { update('target_companies', [...inp.target_companies, companyInput.trim()]); setCompanyInput('') }}}
                  placeholder="e.g. Amazon, Google" className={cn(inputCls, 'flex-1')} />
                <button onClick={() => { if (companyInput.trim()) { update('target_companies', [...inp.target_companies, companyInput.trim()]); setCompanyInput('') }}}
                  className="px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">Add</button>
              </div>
              {inp.target_companies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {inp.target_companies.map(c => (
                    <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {c}<button onClick={() => update('target_companies', inp.target_companies.filter(x => x !== c))}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><ChevronLeft size={15} /> Back</button>
              <button onClick={handlePredict} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold transition-all disabled:opacity-60 btn-glow">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <PlayCircle size={15} />}
                {loading ? 'Predicting…' : 'Predict Placement'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Results ── */}
        {result && cfg && (
          <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Hero card */}
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-sky-700" />
              <div className="absolute inset-0 bg-grid opacity-10" />
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div className="flex items-center gap-6">
                    <ScoreRing score={result.placement_score} label={result.readiness_level} ringColor="white" size={130} />
                    <div>
                      <p className="text-white/60 text-xs mb-1">Placement Score</p>
                      <p className="text-4xl font-black text-white mb-2">{result.placement_score.toFixed(0)}/100</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={cn('px-3 py-1 rounded-full text-xs font-bold border',
                          result.risk_level === 'Low' ? 'bg-emerald-400/20 border-emerald-300/30 text-emerald-200' :
                          result.risk_level === 'Medium' ? 'bg-amber-400/20 border-amber-300/30 text-amber-200' :
                          'bg-red-400/20 border-red-300/30 text-red-200')}>
                          {result.risk_level === 'Low' ? '✅' : result.risk_level === 'Medium' ? '⚠️' : '🚨'} {result.risk_level} Risk
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/20">
                          {result.selection_probability.toFixed(0)}% selection chance
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/80 border border-white/10">
                          {result.confidence_score.toFixed(0)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <p className="text-sm text-white leading-relaxed">{result.mentor_summary}</p>
                </div>
              </div>
            </div>

            {/* Smart insights */}
            {result.smart_insights.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lightbulb size={12} className="text-amber-500" /> Smart Insights
                </p>
                <div className="space-y-2">
                  {result.smart_insights.map((ins, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40">
                      <span className="text-amber-500 shrink-0 mt-0.5">💡</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{ins}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab navigation */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {([
                { key: 'overview', label: 'Overview', icon: <BarChart2 size={13} /> },
                { key: 'actions', label: 'Actions', icon: <Zap size={13} /> },
                { key: 'companies', label: 'Companies', icon: <Target size={13} /> },
                { key: 'whatif', label: 'What-If', icon: <TrendingUp size={13} /> },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                    activeTab === tab.key ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300')}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Module scores */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Module Score Breakdown</p>
                    <div className="space-y-3">
                      <ModuleBar label="Core Assessment" score={result.module_scores.core_assessment} color="bg-blue-500" weight="25%" />
                      <ModuleBar label="Resume ATS" score={result.module_scores.resume_ats} color="bg-violet-500" weight="20%" />
                      <ModuleBar label="Failure Analysis" score={result.module_scores.failure_risk} color="bg-orange-500" weight="20%" />
                      <ModuleBar label="Internship Readiness" score={result.module_scores.internship_readiness} color="bg-emerald-500" weight="15%" />
                      <ModuleBar label="Roadmap Consistency" score={result.module_scores.roadmap_consistency} color="bg-teal-500" weight="20%" />
                    </div>
                  </div>
                  {/* Strengths & weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Strengths</p>
                      <ul className="space-y-2">{result.strengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"><span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{s}</li>)}</ul>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertTriangle size={12} className="text-red-500" /> Weaknesses</p>
                      <ul className="space-y-2">{result.weaknesses.map((w, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"><span className="text-red-400 mt-0.5 shrink-0">✗</span>{w}</li>)}</ul>
                    </div>
                  </div>
                  {/* Weekly plan */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Weekly Improvement Plan</p>
                    <ul className="space-y-2">{result.weekly_plan.map((w, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"><span className="text-blue-500 mt-0.5 shrink-0">→</span>{w}</li>)}</ul>
                  </div>
                </motion.div>
              )}

              {activeTab === 'actions' && (
                <motion.div key="ac" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Top priority actions ranked by impact</p>
                  {result.priority_actions.map((a, i) => <ActionCard key={i} action={a} index={i} />)}
                </motion.div>
              )}

              {activeTab === 'companies' && (
                <motion.div key="co" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {result.company_readiness.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-6 text-center">
                      <p className="text-sm text-slate-400">Add target companies in the form to see readiness analysis</p>
                    </div>
                  ) : result.company_readiness.map((c, i) => <CompanyCard key={i} item={c} index={i} />)}
                </motion.div>
              )}

              {activeTab === 'whatif' && (
                <motion.div key="wi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Simulate how improvements affect your score</p>
                  {result.what_if_scenarios.map((s, i) => <WhatIfCard key={i} scenario={s} index={i} />)}
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={() => { setResult(null); setStep(0) }}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">
              ← Run new prediction
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
