import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Loader2, ChevronRight, ChevronLeft,
  CheckCircle2, XCircle, Lightbulb, Target, TrendingUp,
  BookOpen, Code2, Brain, Users, Briefcase, Clock, X,
} from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import { useNotify } from '@/hooks/useNotify'
import { cn } from '@/lib/utils'
import type {
  FailureIntelligenceResponse, DimensionScore, RootCause,
  WeeklyPlan, StudentAssessment, DSALevel, ProjectType, ConsistencyLevel,
} from '@/types/api'

// ── Constants ─────────────────────────────────────────────────────────────────
const DOMAINS = ['Web Dev', 'AI/ML', 'Data Science', 'Backend', 'DevOps', 'Mobile', 'SDE']
const DSA_LEVELS: { value: DSALevel; label: string; desc: string }[] = [
  { value: 'none', label: 'None', desc: 'Not started' },
  { value: 'beginner', label: 'Beginner', desc: '<20 problems' },
  { value: 'easy', label: 'Easy', desc: '20–60 problems' },
  { value: 'medium', label: 'Medium', desc: '60–150 problems' },
  { value: 'hard', label: 'Hard', desc: '150+ problems' },
]
const PROJECT_TYPES: { value: ProjectType; label: string; desc: string }[] = [
  { value: 'none', label: 'None', desc: 'No projects yet' },
  { value: 'basic', label: 'Basic', desc: 'Todo, calculator' },
  { value: 'real-world', label: 'Real-World', desc: 'Deployed apps' },
  { value: 'scalable', label: 'Scalable', desc: 'Production-grade' },
]
const CONSISTENCY_LEVELS: { value: ConsistencyLevel; label: string }[] = [
  { value: 'very_irregular', label: 'Very Irregular' },
  { value: 'irregular', label: 'Irregular' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'regular', label: 'Regular' },
  { value: 'very_regular', label: 'Very Regular' },
]
const COMMON_SKILLS = [
  'Python', 'Java', 'JavaScript', 'C++', 'React', 'Node.js',
  'SQL', 'Machine Learning', 'Docker', 'AWS', 'Git', 'TypeScript',
  'TensorFlow', 'Data Structures', 'Algorithms', 'System Design',
]
const STEPS = ['Academic', 'Skills & DSA', 'Projects & Exp', 'Behavior']

// ── Sub-components ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
            i < current ? 'bg-orange-500 text-white' :
            i === current ? 'bg-orange-600 text-white ring-2 ring-orange-300 dark:ring-orange-700' :
            'bg-slate-100 dark:bg-slate-800 text-slate-400'
          )}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={cn('flex-1 h-0.5 rounded', i < current ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700')} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function RatingSlider({ label, value, onChange, icon }: {
  label: string; value: number; onChange: (v: number) => void; icon: React.ReactNode
}) {
  const color = value >= 7 ? 'text-emerald-600' : value >= 5 ? 'text-amber-600' : 'text-red-500'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          {icon}<span>{label}</span>
        </div>
        <span className={cn('text-sm font-bold tabular-nums', color)}>{value}/10</span>
      </div>
      <input type="range" min={1} max={10} step={1} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-orange-500" />
      <div className="flex justify-between text-xs text-slate-400">
        <span>Weak</span><span>Average</span><span>Strong</span>
      </div>
    </div>
  )
}

function DimensionBar({ dim, index }: { dim: DimensionScore; index: number }) {
  const color = dim.score >= 70 ? 'bg-emerald-500' : dim.score >= 45 ? 'bg-amber-500' : 'bg-red-500'
  const labelColor = dim.score >= 70 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
    dim.score >= 45 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' :
    'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700 dark:text-slate-300">{dim.name}</span>
          <span className={cn('px-1.5 py-0.5 rounded text-xs font-semibold', labelColor)}>{dim.label}</span>
        </div>
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">{dim.score.toFixed(0)}</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${dim.score}%` }}
          transition={{ duration: 0.7, delay: index * 0.07 }}
          className={cn('h-full rounded-full', color)} />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{dim.insight}</p>
    </motion.div>
  )
}

function RootCauseCard({ cause, index }: { cause: RootCause; index: number }) {
  const sev = {
    critical: { bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', icon: '🚨', label: 'Critical', text: 'text-red-700 dark:text-red-400' },
    moderate: { bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', icon: '⚠️', label: 'Moderate', text: 'text-amber-700 dark:text-amber-400' },
    minor: { bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', icon: 'ℹ️', label: 'Minor', text: 'text-blue-700 dark:text-blue-400' },
  }[cause.severity]
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn('rounded-xl border p-4 space-y-2', sev.bg)}>
      <div className="flex items-center gap-2">
        <span>{sev.icon}</span>
        <span className={cn('text-sm font-bold', sev.text)}>{cause.cause}</span>
        <span className={cn('ml-auto text-xs font-semibold px-2 py-0.5 rounded-full', sev.text, 'bg-white/50 dark:bg-black/20')}>{sev.label}</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{cause.explanation}</p>
      <div className="flex items-start gap-1.5 pt-1">
        <span className="text-emerald-500 text-xs mt-0.5 shrink-0">→</span>
        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{cause.fix}</p>
      </div>
    </motion.div>
  )
}

function WeekCard({ plan, index }: { plan: WeeklyPlan; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold">{plan.week}</span>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{plan.focus}</span>
      </div>
      <ul className="space-y-1.5 mb-3">
        {plan.tasks.map((t, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="text-orange-400 mt-0.5 shrink-0">•</span>{t}
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Clock size={11} className="text-slate-400" />
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{plan.daily_target}</span>
      </div>
    </motion.div>
  )
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, label, size = 120 }: { score: number; label: string; size?: number }) {
  const r = size * 0.4
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor"
            className="text-slate-100 dark:text-slate-800" strokeWidth={size * 0.075} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
            strokeWidth={size * 0.075} strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-slate-900 dark:text-white" style={{ fontSize: size * 0.22 }}>{score.toFixed(0)}</span>
          <span className="text-slate-400" style={{ fontSize: size * 0.09 }}>/100</span>
        </div>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const DEFAULT_PROFILE: StudentAssessment = {
  year: 2, domain: 'SDE', tech_stack: [],
  dsa_level: 'easy', dsa_problems_solved: 30,
  coding_ability: 5, aptitude_level: 5, verbal_ability: 5,
  project_count: 1, project_type: 'basic',
  has_internship: false, internship_months: 0, rejection_count: 0,
  daily_study_hours: 3, consistency: 'moderate', mock_interviews_done: 0,
  target_company: '', target_role: '',
}

export function FailurePage() {
  const toast = useToast()
  const notify = useNotify()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FailureIntelligenceResponse | null>(null)
  const [profile, setProfile] = useState<StudentAssessment>(DEFAULT_PROFILE)
  const [skillInput, setSkillInput] = useState('')

  function update<K extends keyof StudentAssessment>(key: K, val: StudentAssessment[K]) {
    setProfile(p => ({ ...p, [key]: val }))
  }

  function addSkill(s: string) {
    const skill = s.trim()
    if (skill && !profile.tech_stack.includes(skill)) {
      update('tech_stack', [...profile.tech_stack, skill])
    }
    setSkillInput('')
  }

  async function handleAnalyze() {
    setLoading(true)
    try {
      const res = await api.failureIntelligence(profile)
      setResult(res.data)
      toast.success('Analysis complete!')
      notify.moduleComplete('Failure Analysis')
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all'

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xl">🔍</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Failure Intelligence</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Diagnose why you're failing and get a personalized recovery plan</p>
        </div>
      </div>

      {!result && <StepIndicator current={step} total={STEPS.length} />}

      <AnimatePresence mode="wait">
        {/* ── Step 0: Academic Info ── */}
        {!result && step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BookOpen size={15} className="text-orange-500" /> Academic Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Current Year</label>
                <div className="flex gap-2">
                  {[1,2,3,4].map(y => (
                    <button key={y} onClick={() => update('year', y)}
                      className={cn('flex-1 py-2 rounded-lg text-sm font-semibold border transition-all',
                        profile.year === y ? 'bg-orange-600 text-white border-orange-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-orange-400')}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Domain</label>
                <select value={profile.domain} onChange={e => update('domain', e.target.value)} className={inputCls}>
                  {DOMAINS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Target Company (optional)</label>
              <input type="text" value={profile.target_company || ''} onChange={e => update('target_company', e.target.value)}
                placeholder="e.g. Amazon, Google, Infosys" className={inputCls} />
            </div>
            <button onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-all">
              Next <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ── Step 1: Skills & DSA ── */}
        {!result && step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Code2 size={15} className="text-orange-500" /> Skills & DSA
            </h2>
            {/* DSA Level */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">DSA Level</label>
              <div className="grid grid-cols-5 gap-2">
                {DSA_LEVELS.map(l => (
                  <button key={l.value} onClick={() => update('dsa_level', l.value)}
                    className={cn('py-2 px-1 rounded-xl text-xs font-semibold border text-center transition-all',
                      profile.dsa_level === l.value ? 'bg-orange-600 text-white border-orange-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-orange-400')}>
                    <div>{l.label}</div>
                    <div className="text-xs opacity-60 font-normal mt-0.5">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Problems solved */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Problems Solved: <span className="text-orange-600 dark:text-orange-400 font-bold">{profile.dsa_problems_solved}</span>
              </label>
              <input type="range" min={0} max={500} step={5} value={profile.dsa_problems_solved}
                onChange={e => update('dsa_problems_solved', Number(e.target.value))}
                className="w-full accent-orange-500" />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0</span><span>500+</span></div>
            </div>
            {/* Skill ratings */}
            <div className="space-y-4">
              <RatingSlider label="Coding Ability" value={profile.coding_ability} onChange={v => update('coding_ability', v)} icon={<Code2 size={13} />} />
              <RatingSlider label="Aptitude Level" value={profile.aptitude_level} onChange={v => update('aptitude_level', v)} icon={<Brain size={13} />} />
              <RatingSlider label="Verbal / Communication" value={profile.verbal_ability} onChange={v => update('verbal_ability', v)} icon={<Users size={13} />} />
            </div>
            {/* Tech stack */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Tech Stack</label>
              <div className="flex gap-2 mb-2">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill(skillInput)}
                  placeholder="Type skill + Enter" className={cn(inputCls, 'flex-1')} />
                <button onClick={() => addSkill(skillInput)}
                  className="px-3 py-2 rounded-xl bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-all">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_SKILLS.filter(s => !profile.tech_stack.includes(s)).slice(0, 8).map(s => (
                  <button key={s} onClick={() => addSkill(s)}
                    className="px-2.5 py-1 rounded-full text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-orange-400 hover:text-orange-600 transition-all">
                    + {s}
                  </button>
                ))}
              </div>
              {profile.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.tech_stack.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                      {s}<button onClick={() => update('tech_stack', profile.tech_stack.filter(x => x !== s))}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <ChevronLeft size={15} /> Back
              </button>
              <button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-all">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Projects & Experience ── */}
        {!result && step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Briefcase size={15} className="text-orange-500" /> Projects & Experience
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Project Type</label>
              <div className="grid grid-cols-2 gap-2">
                {PROJECT_TYPES.map(p => (
                  <button key={p.value} onClick={() => update('project_type', p.value)}
                    className={cn('py-2.5 px-3 rounded-xl text-sm font-medium border text-left transition-all',
                      profile.project_type === p.value ? 'bg-orange-600 text-white border-orange-600' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-400')}>
                    <div>{p.label}</div>
                    <div className="text-xs opacity-60 font-normal">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Number of Projects: <span className="text-orange-600 dark:text-orange-400 font-bold">{profile.project_count}</span>
              </label>
              <input type="range" min={0} max={10} step={1} value={profile.project_count}
                onChange={e => update('project_count', Number(e.target.value))} className="w-full accent-orange-500" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <input type="checkbox" id="internship" checked={profile.has_internship}
                onChange={e => update('has_internship', e.target.checked)}
                className="w-4 h-4 accent-orange-500" />
              <label htmlFor="internship" className="text-sm text-slate-700 dark:text-slate-300 font-medium">I have internship experience</label>
            </div>
            {profile.has_internship && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Internship Duration: <span className="text-orange-600 dark:text-orange-400 font-bold">{profile.internship_months} months</span>
                </label>
                <input type="range" min={1} max={12} step={1} value={profile.internship_months}
                  onChange={e => update('internship_months', Number(e.target.value))} className="w-full accent-orange-500" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Rejections so far: <span className="text-orange-600 dark:text-orange-400 font-bold">{profile.rejection_count}</span>
              </label>
              <input type="range" min={0} max={20} step={1} value={profile.rejection_count}
                onChange={e => update('rejection_count', Number(e.target.value))} className="w-full accent-orange-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <ChevronLeft size={15} /> Back
              </button>
              <button onClick={() => setStep(3)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-all">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Behavior ── */}
        {!result && step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp size={15} className="text-orange-500" /> Study Behavior
            </h2>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Daily Study Hours: <span className="text-orange-600 dark:text-orange-400 font-bold">{profile.daily_study_hours}h</span>
              </label>
              <input type="range" min={0.5} max={12} step={0.5} value={profile.daily_study_hours}
                onChange={e => update('daily_study_hours', Number(e.target.value))} className="w-full accent-orange-500" />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0.5h</span><span>12h</span></div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Study Consistency</label>
              <div className="grid grid-cols-5 gap-1.5">
                {CONSISTENCY_LEVELS.map(c => (
                  <button key={c.value} onClick={() => update('consistency', c.value)}
                    className={cn('py-2 px-1 rounded-xl text-xs font-semibold border text-center transition-all',
                      profile.consistency === c.value ? 'bg-orange-600 text-white border-orange-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-orange-400')}>
                    {c.label.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Mock Interviews Done: <span className="text-orange-600 dark:text-orange-400 font-bold">{profile.mock_interviews_done}</span>
              </label>
              <input type="range" min={0} max={30} step={1} value={profile.mock_interviews_done}
                onChange={e => update('mock_interviews_done', Number(e.target.value))} className="w-full accent-orange-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <ChevronLeft size={15} /> Back
              </button>
              <button onClick={handleAnalyze} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-semibold transition-all disabled:opacity-60">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <AlertTriangle size={15} />}
                {loading ? 'Analyzing…' : 'Diagnose My Failures'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Results ── */}
        {result && (
          <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Mentor summary banner */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-lg">🎓</div>
                <div>
                  <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Mentor Assessment</p>
                  <p className="text-sm leading-relaxed">{result.mentor_summary}</p>
                </div>
              </div>
            </div>

            {/* Score row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Score</p>
                <ScoreRing score={result.overall_score} label={result.overall_score >= 70 ? 'Good' : result.overall_score >= 50 ? 'Average' : 'Needs Work'} />
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Failure Risk</p>
                <ScoreRing score={result.failure_risk_pct} label={result.failure_risk_pct >= 60 ? 'High Risk' : result.failure_risk_pct >= 35 ? 'Medium Risk' : 'Low Risk'} />
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Placement Ready</p>
                <ScoreRing score={result.placement_readiness_pct} label={result.placement_readiness_pct >= 65 ? 'Ready' : result.placement_readiness_pct >= 45 ? 'Almost' : 'Not Yet'} />
              </div>
            </div>

            {/* Dimension scores */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Skill Dimensions</p>
              <div className="space-y-5">
                {result.dimensions.map((d, i) => <DimensionBar key={d.name} dim={d} index={i} />)}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Strengths
                </p>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <XCircle size={12} className="text-red-500" /> Weaknesses
                </p>
                {result.weaknesses.length === 0 ? (
                  <p className="text-sm text-emerald-500 font-medium">No critical weaknesses found!</p>
                ) : (
                  <ul className="space-y-2">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="text-red-400 mt-0.5 shrink-0">✗</span>{w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Root causes */}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle size={12} className="text-orange-500" /> Root Causes of Failure
              </p>
              <div className="space-y-3">
                {result.root_causes.map((c, i) => <RootCauseCard key={i} cause={c} index={i} />)}
              </div>
            </div>

            {/* Intelligent insights */}
            {result.intelligent_insights.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lightbulb size={12} className="text-amber-500" /> Mentor Insights
                </p>
                <div className="space-y-2.5">
                  {result.intelligent_insights.map((ins, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40">
                      <span className="text-amber-500 shrink-0 mt-0.5">💡</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{ins}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Domain readiness */}
            {Object.keys(result.domain_readiness).length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Target size={12} className="text-blue-500" /> Domain Skill Coverage
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.domain_readiness).map(([skill, covered]) => (
                    <span key={skill} className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border',
                      covered > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                    )}>
                      {covered > 0 ? '✓' : '✗'} {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Company readiness */}
            {result.company_readiness && (
              <div className={cn('rounded-2xl border p-5',
                result.company_readiness.ready
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700')}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Target size={14} className="text-blue-500" /> {result.company_readiness.company} Readiness
                  </p>
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold',
                    result.company_readiness.ready
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300')}>
                    {result.company_readiness.ready ? '✓ Ready' : `${result.company_readiness.readiness_pct.toFixed(0)}%`}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.company_readiness.readiness_pct}%` }}
                    transition={{ duration: 0.8 }}
                    className={cn('h-full rounded-full', result.company_readiness.ready ? 'bg-emerald-500' : 'bg-orange-500')} />
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{result.company_readiness.verdict}</p>
                {result.company_readiness.missing.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.company_readiness.missing.map(m => (
                      <span key={m} className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">✗ {m}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Estimated prep time: {result.company_readiness.prep_weeks} weeks</p>
              </div>
            )}

            {/* Action plan */}
            {result.action_plan.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <BookOpen size={12} className="text-orange-500" /> Personalized Action Plan
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.action_plan.map((p, i) => <WeekCard key={i} plan={p} index={i} />)}
                </div>
              </div>
            )}

            {/* Skill gaps */}
            {result.skill_gaps.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Skill Gaps to Fill</p>
                <div className="flex flex-wrap gap-2">
                  {result.skill_gaps.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setResult(null); setStep(0) }}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">
              ← Start over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
