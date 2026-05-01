import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Loader2, ChevronRight, ChevronLeft, Star, MapPin, TrendingUp, X, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import { useNotify } from '@/hooks/useNotify'
import { GuidanceHint } from '@/components/guidance/GuidanceHint'
import { cn } from '@/lib/utils'
import type { ProfileAnalysisResponse, CompanyRecommendation, StudentProfile } from '@/types/api'

// ── Constants ─────────────────────────────────────────────────────────────────
const COURSES = ['BTech', 'BCA', 'BSc CS', 'MCA', 'MTech', 'BBA', 'MBA', 'Other']
const DOMAINS = [
  'Software Engineering', 'Data Science', 'Web Development',
  'Machine Learning', 'DevOps', 'Mobile Development',
  'Cybersecurity', 'Cloud Computing', 'AI/ML', 'Product Management',
]
const COMMON_SKILLS = [
  'Python', 'Java', 'JavaScript', 'C++', 'React', 'Node.js',
  'SQL', 'Machine Learning', 'Docker', 'AWS', 'Git', 'TypeScript',
  'TensorFlow', 'Data Structures', 'Algorithms', 'System Design',
]
const TIER_CONFIG = {
  1: { label: 'MNC', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  2: { label: 'Mid-Level', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
  3: { label: 'Startup', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
}
const IMPACT_COLOR = { High: 'text-emerald-600 dark:text-emerald-400', Medium: 'text-amber-600 dark:text-amber-400', Low: 'text-slate-500 dark:text-slate-400' }

// ── Sub-components ────────────────────────────────────────────────────────────
function ReadinessMeter({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const circumference = 2 * Math.PI * 48
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 108 108">
          <circle cx="54" cy="54" r="48" fill="none" stroke="currentColor"
            className="text-slate-100 dark:text-slate-800" strokeWidth="9" />
          <motion.circle cx="54" cy="54" r="48" fill="none" stroke={color}
            strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900 dark:text-white">{score.toFixed(0)}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

function CompanyCard({ rec, index }: { rec: CompanyRecommendation; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const tier = TIER_CONFIG[rec.tier as 1 | 2 | 3] ?? TIER_CONFIG[3]
  const probPct = Math.round(rec.selection_probability * 100)
  const probColor = probPct >= 60 ? 'bg-emerald-500' : probPct >= 35 ? 'bg-amber-500' : 'bg-red-400'

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{rec.company}</h3>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', tier.color)}>{tier.label}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{rec.role}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-slate-800 dark:text-slate-100">{rec.match_score.toFixed(0)}%</p>
            <p className="text-xs text-slate-400">match</p>
          </div>
        </div>

        {/* Selection probability bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500 dark:text-slate-400">Selection chance</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{probPct}%</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${probPct}%` }}
              transition={{ duration: 0.7, delay: index * 0.06 }}
              className={cn('h-full rounded-full', probColor)} />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1"><MapPin size={11} />{rec.location}</span>
          <span className="flex items-center gap-1"><TrendingUp size={11} />
            <span className={IMPACT_COLOR[rec.placement_impact.level]}>{rec.placement_impact.level} Impact</span>
          </span>
        </div>

        {/* Matched skills */}
        {rec.matched_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {rec.matched_skills.slice(0, 4).map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ✓ {s}
              </span>
            ))}
          </div>
        )}

        <button onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
          {expanded ? 'Show less' : 'Show details'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-3 overflow-hidden">
            {rec.missing_skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Missing Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {rec.missing_skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
                      ✗ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Why this company?</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{rec.reason}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Placement Impact</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{rec.placement_impact.explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Step components ───────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
            i < current ? 'bg-green-500 text-white' :
            i === current ? 'bg-green-600 text-white ring-2 ring-green-300 dark:ring-green-700' :
            'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && <div className={cn('flex-1 h-0.5 rounded', i < current ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700')} />}
        </React.Fragment>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const STEPS = ['Academic Info', 'Skills & Projects', 'Domain & Resume', 'Results']

export function InternshipPage() {
  const toast = useToast()
  const notify = useNotify()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProfileAnalysisResponse | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [sortBy, setSortBy] = useState<'probability' | 'match' | 'tier'>('probability')

  const [profile, setProfile] = useState<StudentProfile>({
    year: 2, course: 'BTech', cgpa: 7.5,
    skills: [], project_count: 2,
    project_domains: [], target_domain: 'Software Engineering',
    ats_score: 50, resume_score: 0.5,
  })

  function update(key: keyof StudentProfile, val: unknown) {
    setProfile((p) => ({ ...p, [key]: val }))
  }

  function addSkill(skill: string) {
    const s = skill.trim()
    if (s && !profile.skills.includes(s)) {
      update('skills', [...profile.skills, s])
    }
    setSkillInput('')
  }

  function removeSkill(skill: string) {
    update('skills', profile.skills.filter((s) => s !== skill))
  }

  async function handleAnalyze() {
    if (profile.skills.length === 0) { toast.error('Add at least one skill'); return }
    setLoading(true)
    try {
      const res = await api.internshipAnalyzeProfile(profile)
      setResult(res.data)
      setStep(3)
      toast.success('Analysis complete!')
      notify.moduleComplete('Internship Predictor')
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const sortedRecs = result ? [...result.company_recommendations].sort((a, b) => {
    if (sortBy === 'probability') return b.selection_probability - a.selection_probability
    if (sortBy === 'match') return b.match_score - a.match_score
    return a.tier - b.tier
  }) : []

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all'

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xl">💼</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Internship Advisor</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">AI-powered company recommendations and selection probability</p>
        </div>
      </div>

      <GuidanceHint
        title="Get stronger internship matches"
        description="Learn how to improve your profile and application fit with help text while reviewing company recommendations."
      />

      {step < 3 && <StepIndicator current={step} total={3} />}

      <AnimatePresence mode="wait">
        {/* ── Step 0: Academic Info ── */}
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Academic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Current Year</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((y) => (
                    <button key={y} onClick={() => update('year', y)}
                      className={cn('flex-1 py-2 rounded-lg text-sm font-semibold border transition-all',
                        profile.year === y ? 'bg-green-600 text-white border-green-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-green-400')}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Course</label>
                <select value={profile.course} onChange={(e) => update('course', e.target.value)} className={inputCls}>
                  {COURSES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                CGPA: <span className="text-green-600 dark:text-green-400 font-bold">{profile.cgpa.toFixed(1)}</span>
              </label>
              <input type="range" min={0} max={10} step={0.1} value={profile.cgpa}
                onChange={(e) => update('cgpa', Number(e.target.value))}
                className="w-full accent-green-500" />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0</span><span>10</span></div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Resume ATS Score (from Resume Analyzer): <span className="text-green-600 dark:text-green-400 font-bold">{profile.ats_score}</span>
              </label>
              <input type="range" min={0} max={100} step={1} value={profile.ats_score ?? 50}
                onChange={(e) => update('ats_score', Number(e.target.value))}
                className="w-full accent-green-500" />
            </div>
            <button onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all">
              Next <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ── Step 1: Skills & Projects ── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Skills & Projects</h2>

            {/* Skill input */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Add Skills</label>
              <div className="flex gap-2 mb-2">
                <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill(skillInput)}
                  placeholder="Type a skill and press Enter"
                  className={cn(inputCls, 'flex-1')} />
                <button onClick={() => addSkill(skillInput)}
                  className="px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-all">
                  Add
                </button>
              </div>
              {/* Quick add chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {COMMON_SKILLS.filter((s) => !profile.skills.includes(s)).slice(0, 10).map((s) => (
                  <button key={s} onClick={() => addSkill(s)}
                    className="px-2.5 py-1 rounded-full text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-green-400 hover:text-green-600 transition-all">
                    + {s}
                  </button>
                ))}
              </div>
              {/* Selected skills */}
              {profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
                      {s}
                      <button onClick={() => removeSkill(s)}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Number of Projects: <span className="text-green-600 dark:text-green-400 font-bold">{profile.project_count}</span>
              </label>
              <input type="range" min={0} max={10} step={1} value={profile.project_count}
                onChange={(e) => update('project_count', Number(e.target.value))}
                className="w-full accent-green-500" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <ChevronLeft size={15} /> Back
              </button>
              <button onClick={() => setStep(2)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Domain ── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Target Domain</h2>
            <div className="grid grid-cols-2 gap-2">
              {DOMAINS.map((d) => (
                <button key={d} onClick={() => update('target_domain', d)}
                  className={cn('py-2.5 px-3 rounded-xl text-sm font-medium border text-left transition-all',
                    profile.target_domain === d
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-green-400')}>
                  {d}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <ChevronLeft size={15} /> Back
              </button>
              <button onClick={handleAnalyze} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all disabled:opacity-60">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Briefcase size={15} />}
                {loading ? 'Analyzing…' : 'Get Recommendations'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Results ── */}
        {step === 3 && result && (
          <motion.div key="step3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Top metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Readiness Score</p>
                <ReadinessMeter score={result.readiness_score} label={result.readiness_label} />
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-emerald-500" /> Strengths
                </p>
                <ul className="space-y-1.5">
                  {result.profile_strengths.map((s, i) => (
                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertCircle size={12} className="text-amber-500" /> Suggestions
                </p>
                <ul className="space-y-1.5">
                  {result.improvement_suggestions.slice(0, 4).map((s, i) => (
                    <li key={i} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Impact summary */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">{result.placement_impact_summary}</p>
            </div>

            {/* Company recommendations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Company Recommendations ({result.company_recommendations.length})
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Sort:</span>
                  {(['probability', 'match', 'tier'] as const).map((s) => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={cn('px-2.5 py-1 rounded-lg font-medium transition-all',
                        sortBy === s ? 'bg-green-600 text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300')}>
                      {s === 'probability' ? 'Chance' : s === 'match' ? 'Match' : 'Tier'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedRecs.map((rec, i) => <CompanyCard key={`${rec.company}-${i}`} rec={rec} index={i} />)}
              </div>
            </div>

            <button onClick={() => { setStep(0); setResult(null) }}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">
              ← Start over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
