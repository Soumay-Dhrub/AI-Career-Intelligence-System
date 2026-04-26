import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Navigation, Loader2, ChevronRight, ChevronLeft,
  CheckCircle2, Clock, Lightbulb, TrendingUp, BookOpen,
  Code2, Briefcase, Target, X, ExternalLink, Calendar,
} from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import { useNotify } from '@/hooks/useNotify'
import { cn } from '@/lib/utils'
import type {
  IntelligentRoadmapResponse, RoadmapPhase, ProjectIdea,
  WeeklyGoalRoadmap, IndustryInsight, RoadmapInput, DSALevel,
} from '@/types/api'

// ── Constants ─────────────────────────────────────────────────────────────────
const DOMAINS = ['Web Dev', 'AI/ML', 'Data Science', 'Backend', 'DevOps', 'Mobile', 'SDE']
const ROLES = ['Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'SDE', 'ML Engineer', 'Data Scientist', 'DevOps Engineer', 'Mobile Developer']
const DSA_LEVELS: { value: DSALevel; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]
const COMMON_SKILLS = ['Python', 'JavaScript', 'React', 'Node.js', 'Java', 'C++', 'SQL', 'Docker', 'AWS', 'Git', 'TypeScript', 'Machine Learning']
const STEPS = ['Career Goal', 'Current Skills', 'Experience', 'Schedule']

// ── Sub-components ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
            i < current ? 'bg-teal-500 text-white' :
            i === current ? 'bg-teal-600 text-white ring-2 ring-teal-300 dark:ring-teal-700' :
            'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && <div className={cn('flex-1 h-0.5 rounded', i < current ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700')} />}
        </React.Fragment>
      ))}
    </div>
  )
}

function PhaseCard({ phase, index }: { phase: RoadmapPhase; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)
  const colors = ['from-blue-500 to-cyan-500', 'from-violet-500 to-purple-500', 'from-teal-500 to-emerald-500', 'from-orange-500 to-red-500']
  const color = colors[index % colors.length]
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center gap-4 text-left">
        <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-black text-sm shrink-0', color)}>
          {phase.phase_number}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{phase.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{phase.duration_weeks} weeks · {phase.skills.slice(0, 3).join(', ')}</p>
        </div>
        <span className="text-xs text-slate-400 shrink-0">{expanded ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">{phase.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {phase.skills.map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 border border-teal-200 dark:border-teal-800">{s}</span>
                ))}
              </div>
              <div className="space-y-2">
                {phase.tasks.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-teal-500 mt-0.5 shrink-0">→</span>
                    <div>
                      <span>{t.task}</span>
                      {t.resources.length > 0 && (
                        <a href={t.resources[0]} target="_blank" rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center gap-0.5 text-teal-600 dark:text-teal-400 hover:underline">
                          <ExternalLink size={10} /> Resource
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Target size={12} className="text-teal-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{phase.milestone}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ProjectCard({ project, index }: { project: ProjectIdea; index: number }) {
  const diffColor = { beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400', intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', advanced: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' }[project.difficulty]
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{project.title}</p>
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold shrink-0', diffColor)}>{project.difficulty}</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{project.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {project.tech_stack.map(t => (
          <span key={t} className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{t}</span>
        ))}
      </div>
      <div className="flex items-start gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
        <TrendingUp size={11} className="text-teal-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 dark:text-slate-400">{project.impact}</p>
      </div>
    </motion.div>
  )
}

function InsightBadge({ insight }: { insight: IndustryInsight }) {
  const demandColor = { high: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400', medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400', low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' }[insight.demand_level]
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-bold shrink-0 mt-0.5', demandColor)}>{insight.demand_level.toUpperCase()}</span>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{insight.trend}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{insight.relevance}</p>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const DEFAULT_INPUT: RoadmapInput = {
  year: 2, domain: 'SDE', target_role: 'SDE',
  known_skills: [], dsa_level: 'easy',
  project_count: 1, has_internship: false,
  target_companies: [], hours_per_day: 3,
}

export function RoadmapToolPage() {
  const toast = useToast()
  const notify = useNotify()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IntelligentRoadmapResponse | null>(null)
  const [inp, setInp] = useState<RoadmapInput>(DEFAULT_INPUT)
  const [skillInput, setSkillInput] = useState('')
  const [companyInput, setCompanyInput] = useState('')
  const [activeTab, setActiveTab] = useState<'phases' | 'schedule' | 'projects' | 'insights'>('phases')

  function update<K extends keyof RoadmapInput>(key: K, val: RoadmapInput[K]) {
    setInp(p => ({ ...p, [key]: val }))
  }

  function addSkill(s: string) {
    const skill = s.trim()
    if (skill && !inp.known_skills.includes(skill)) update('known_skills', [...inp.known_skills, skill])
    setSkillInput('')
  }

  function addCompany(c: string) {
    const co = c.trim()
    if (co && !inp.target_companies.includes(co)) update('target_companies', [...inp.target_companies, co])
    setCompanyInput('')
  }

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await api.roadmapGenerate(inp)
      setResult(res.data)
      toast.success('Roadmap generated!')
      notify.moduleComplete('Roadmap Generator')
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all'

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xl">🗺️</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">AI Roadmap Generator</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Personalized, industry-aligned learning roadmap with daily schedule</p>
        </div>
      </div>

      {!result && <StepIndicator current={step} total={STEPS.length} />}

      <AnimatePresence mode="wait">
        {/* ── Step 0: Career Goal ── */}
        {!result && step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Target size={15} className="text-teal-500" /> Career Goal
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Year of Study</label>
                <div className="flex gap-2">
                  {[1,2,3,4].map(y => (
                    <button key={y} onClick={() => update('year', y)}
                      className={cn('flex-1 py-2 rounded-lg text-sm font-semibold border transition-all',
                        inp.year === y ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400')}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Domain</label>
                <select value={inp.domain} onChange={e => update('domain', e.target.value)} className={inputCls}>
                  {DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Target Role</label>
              <select value={inp.target_role} onChange={e => update('target_role', e.target.value)} className={inputCls}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Target Companies (optional)</label>
              <div className="flex gap-2 mb-2">
                <input value={companyInput} onChange={e => setCompanyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCompany(companyInput)}
                  placeholder="e.g. Amazon, Google" className={cn(inputCls, 'flex-1')} />
                <button onClick={() => addCompany(companyInput)} className="px-3 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-all">Add</button>
              </div>
              {inp.target_companies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {inp.target_companies.map(c => (
                    <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                      {c}<button onClick={() => update('target_companies', inp.target_companies.filter(x => x !== c))}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all">
              Next <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ── Step 1: Current Skills ── */}
        {!result && step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Code2 size={15} className="text-teal-500" /> Current Skills
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">DSA Level</label>
              <div className="flex gap-2">
                {DSA_LEVELS.map(l => (
                  <button key={l.value} onClick={() => update('dsa_level', l.value)}
                    className={cn('flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                      inp.dsa_level === l.value ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400')}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Known Technologies</label>
              <div className="flex gap-2 mb-2">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill(skillInput)}
                  placeholder="Type skill + Enter" className={cn(inputCls, 'flex-1')} />
                <button onClick={() => addSkill(skillInput)} className="px-3 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-all">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_SKILLS.filter(s => !inp.known_skills.includes(s)).slice(0, 8).map(s => (
                  <button key={s} onClick={() => addSkill(s)} className="px-2.5 py-1 rounded-full text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-all">+ {s}</button>
                ))}
              </div>
              {inp.known_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {inp.known_skills.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                      {s}<button onClick={() => update('known_skills', inp.known_skills.filter(x => x !== s))}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><ChevronLeft size={15} /> Back</button>
              <button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all">Next <ChevronRight size={16} /></button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Experience ── */}
        {!result && step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Briefcase size={15} className="text-teal-500" /> Experience
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Projects Built: <span className="text-teal-600 dark:text-teal-400 font-bold">{inp.project_count}</span>
              </label>
              <input type="range" min={0} max={10} step={1} value={inp.project_count}
                onChange={e => update('project_count', Number(e.target.value))} className="w-full accent-teal-500" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <input type="checkbox" id="intern" checked={inp.has_internship}
                onChange={e => update('has_internship', e.target.checked)} className="w-4 h-4 accent-teal-500" />
              <label htmlFor="intern" className="text-sm text-slate-700 dark:text-slate-300 font-medium">I have internship experience</label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><ChevronLeft size={15} /> Back</button>
              <button onClick={() => setStep(3)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all">Next <ChevronRight size={16} /></button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Schedule ── */}
        {!result && step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock size={15} className="text-teal-500" /> Daily Schedule
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Hours available per day: <span className="text-teal-600 dark:text-teal-400 font-bold">{inp.hours_per_day}h</span>
              </label>
              <input type="range" min={0.5} max={10} step={0.5} value={inp.hours_per_day}
                onChange={e => update('hours_per_day', Number(e.target.value))} className="w-full accent-teal-500" />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0.5h</span><span>10h</span></div>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 text-xs text-teal-700 dark:text-teal-400">
              💡 Recommended: 3–5 hours/day for consistent progress without burnout
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"><ChevronLeft size={15} /> Back</button>
              <button onClick={handleGenerate} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-sm font-semibold transition-all disabled:opacity-60">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
                {loading ? 'Generating…' : 'Generate My Roadmap'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Results ── */}
        {result && (
          <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Hero summary */}
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700" />
              <div className="absolute inset-0 bg-grid opacity-10" />
              <div className="relative z-10 p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold mb-2',
                      result.user_level === 'advanced' ? 'bg-emerald-400/20 text-emerald-200' :
                      result.user_level === 'intermediate' ? 'bg-amber-400/20 text-amber-200' :
                      'bg-blue-400/20 text-blue-200')}>
                      {result.user_level.charAt(0).toUpperCase() + result.user_level.slice(1)} Level
                    </span>
                    <p className="text-white text-sm leading-relaxed max-w-xl">{result.career_path_summary}</p>
                  </div>
                  <div className="text-center shrink-0">
                    <p className="text-3xl font-black text-white">{result.total_weeks}</p>
                    <p className="text-teal-200 text-xs">weeks total</p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <p className="text-xs text-teal-200 font-medium">Next Milestone</p>
                  <p className="text-sm text-white font-semibold mt-0.5">{result.next_milestone}</p>
                </div>
              </div>
            </div>

            {/* Mentor insights */}
            {result.mentor_insights.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lightbulb size={12} className="text-amber-500" /> Mentor Insights
                </p>
                <div className="space-y-2">
                  {result.mentor_insights.map((ins, i) => (
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
                { key: 'phases', label: 'Phases', icon: <BookOpen size={13} /> },
                { key: 'schedule', label: 'Schedule', icon: <Clock size={13} /> },
                { key: 'projects', label: 'Projects', icon: <Code2 size={13} /> },
                { key: 'insights', label: 'Industry', icon: <TrendingUp size={13} /> },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                    activeTab === tab.key ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300')}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === 'phases' && (
                <motion.div key="phases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {result.phases.map((p, i) => <PhaseCard key={p.phase_number} phase={p} index={i} />)}
                  {/* Weekly goals */}
                  {result.weekly_goals.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Calendar size={12} className="text-teal-500" /> Weekly Goals (First 8 Weeks)
                      </p>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {result.weekly_goals.map((g, i) => (
                          <div key={i} className="flex gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-xs font-bold text-teal-700 dark:text-teal-400 shrink-0">W{g.week_number}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{g.focus_topic}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{g.target_problems} problems{g.mock_test ? ' · Mock test' : ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'schedule' && (
                <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Daily Schedule ({result.daily_schedule.total_hours}h/day)</p>
                    <div className="space-y-2 mb-4">
                      {result.daily_schedule.schedule.map((slot, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-28 shrink-0">{slot.time}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300">{slot.activity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'DSA', mins: result.daily_schedule.dsa_minutes, color: 'bg-blue-500' },
                        { label: 'Learning', mins: result.daily_schedule.learning_minutes, color: 'bg-teal-500' },
                        { label: 'Projects', mins: result.daily_schedule.project_minutes, color: 'bg-violet-500' },
                        { label: 'Revision', mins: result.daily_schedule.revision_minutes, color: 'bg-amber-500' },
                      ].map(item => (
                        <div key={item.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{item.mins}m</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', item.color)} style={{ width: `${(item.mins / (result.daily_schedule.total_hours * 60)) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Interview prep */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Target size={12} className="text-teal-500" /> Interview Preparation Plan
                    </p>
                    <ul className="space-y-2">
                      {result.interview_prep.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle2 size={13} className="text-teal-500 mt-0.5 shrink-0" />{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}

              {activeTab === 'projects' && (
                <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  {result.project_suggestions.map((p, i) => <ProjectCard key={i} project={p} index={i} />)}
                  {/* Skill gaps */}
                  {result.skill_gaps.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Skills to Learn</p>
                      <div className="flex flex-wrap gap-2">
                        {result.skill_gaps.map(s => (
                          <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'insights' && (
                <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <TrendingUp size={12} className="text-teal-500" /> Industry Demand Insights
                    </p>
                    <div className="space-y-2">
                      {result.industry_insights.map((ins, i) => <InsightBadge key={i} insight={ins} />)}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Required Skills for {inp.target_role}</p>
                    <div className="flex flex-wrap gap-2">
                      {result.required_skills.map(s => (
                        <span key={s} className={cn('px-2.5 py-1 rounded-full text-xs font-medium border',
                          inp.known_skills.includes(s)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700')}>
                          {inp.known_skills.includes(s) ? '✓ ' : ''}{s}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={() => { setResult(null); setStep(0) }}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">
              ← Generate new roadmap
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
