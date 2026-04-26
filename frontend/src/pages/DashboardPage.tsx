import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayCircle, RefreshCw, Sparkles, Zap, ArrowRight,
  Brain, FileText, Briefcase, AlertTriangle, Navigation, Target,
  TrendingUp, TrendingDown, CheckCircle2, AlertCircle,
  Flame, Calendar, BarChart2, Lightbulb, ChevronRight,
  Download, Clock, Star,
} from 'lucide-react'
import { useAnalysisStore } from '@/stores/analysisStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConsistencyLineChart } from '@/components/charts/ConsistencyLineChart'
import { SkillGapBarChart } from '@/components/charts/SkillGapBarChart'
import { AnalyzeModal } from '@/components/forms/AnalyzeModal'
import { useAuthStore } from '@/stores/authStore'
import { cn, formatPercent, getRiskBgColor } from '@/lib/utils'
import { DEMO_REPORT } from '@/lib/demoData'
import type { PlacementReport } from '@/types/api'

// ── Module config ─────────────────────────────────────────────────────────────
const MODULES = [
  {
    title: 'Burnout & Consistency', desc: 'Analyze study patterns & detect burnout risk',
    icon: '🧠', href: '/burnout', emoji: Brain,
    gradient: 'from-purple-500 to-violet-600',
    border: 'border-purple-200 dark:border-purple-800/40',
    bg: 'bg-purple-50 dark:bg-purple-900/10',
    ring: 'ring-purple-500/20',
    getStatus: (r: PlacementReport) => ({ label: r.burnout_risk + ' Risk', ok: r.burnout_risk === 'Low' }),
  },
  {
    title: 'Resume Analyzer', desc: 'ATS score & skill gap analysis',
    icon: '📄', href: '/resume', emoji: FileText,
    gradient: 'from-blue-500 to-cyan-500',
    border: 'border-blue-200 dark:border-blue-800/40',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    ring: 'ring-blue-500/20',
    getStatus: (r: PlacementReport) => ({ label: (r.resume_score * 100).toFixed(0) + '% ATS', ok: r.resume_score >= 0.65 }),
  },
  {
    title: 'Internship Advisor', desc: 'Company matches & selection probability',
    icon: '💼', href: '/internship', emoji: Briefcase,
    gradient: 'from-green-500 to-emerald-500',
    border: 'border-green-200 dark:border-green-800/40',
    bg: 'bg-green-50 dark:bg-green-900/10',
    ring: 'ring-green-500/20',
    getStatus: (r: PlacementReport) => ({ label: r.internship_score.toFixed(1) + '/10', ok: r.internship_score >= 6 }),
  },
  {
    title: 'Failure Intelligence', desc: 'Root cause diagnosis & recovery plan',
    icon: '🔍', href: '/failure', emoji: AlertTriangle,
    gradient: 'from-orange-500 to-red-500',
    border: 'border-orange-200 dark:border-orange-800/40',
    bg: 'bg-orange-50 dark:bg-orange-900/10',
    ring: 'ring-orange-500/20',
    getStatus: (r: PlacementReport) => ({ label: r.failure_reasons.length === 0 ? 'No Issues' : r.failure_reasons.length + ' Issues', ok: r.failure_reasons.length === 0 }),
  },
  {
    title: 'Roadmap Generator', desc: 'Personalized learning path with timeline',
    icon: '🗺️', href: '/roadmap-tool', emoji: Navigation,
    gradient: 'from-teal-500 to-cyan-500',
    border: 'border-teal-200 dark:border-teal-800/40',
    bg: 'bg-teal-50 dark:bg-teal-900/10',
    ring: 'ring-teal-500/20',
    getStatus: (r: PlacementReport) => ({ label: r.roadmap.length + ' Skills', ok: r.roadmap.length > 0 }),
  },
  {
    title: 'Placement Predictor', desc: 'Final readiness score & company analysis',
    icon: '🎯', href: '/placement', emoji: Target,
    gradient: 'from-blue-600 to-sky-500',
    border: 'border-blue-200 dark:border-blue-800/40',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    ring: 'ring-blue-500/20',
    getStatus: (r: PlacementReport) => ({ label: (r.placement_probability * 100).toFixed(0) + '% Ready', ok: r.placement_probability >= 0.65 }),
  },
]

// ── Streak helper ─────────────────────────────────────────────────────────────
function getStreak(): number {
  try {
    const raw = localStorage.getItem('study_streak')
    if (!raw) return 0
    const { count, lastDate } = JSON.parse(raw)
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (lastDate === today || lastDate === yesterday) return count
    return 0
  } catch { return 0 }
}

function bumpStreak() {
  try {
    const today = new Date().toDateString()
    const raw = localStorage.getItem('study_streak')
    if (raw) {
      const { count, lastDate } = JSON.parse(raw)
      if (lastDate === today) return
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      const newCount = lastDate === yesterday ? count + 1 : 1
      localStorage.setItem('study_streak', JSON.stringify({ count: newCount, lastDate: today }))
    } else {
      localStorage.setItem('study_streak', JSON.stringify({ count: 1, lastDate: today }))
    }
  } catch {}
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color, trend, delay = 0 }: {
  label: string; value: string; sub?: string; icon: React.ReactNode
  color: string; trend?: number; delay?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>{icon}</div>
        {trend !== undefined && (
          <span className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
            trend >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400')}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </motion.div>
  )
}

function InsightCard({ insight, index }: { insight: string; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.07 }}
      className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40">
      <Lightbulb size={13} className="text-amber-500 shrink-0 mt-0.5" />
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{insight}</p>
    </motion.div>
  )
}

function ModuleCard({ mod, report, index }: { mod: typeof MODULES[0]; report: PlacementReport; index: number }) {
  const navigate = useNavigate()
  const status = mod.getStatus(report)
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={() => navigate(mod.href)}
      className={cn('group rounded-2xl border p-4 cursor-pointer transition-all duration-200', mod.border, mod.bg,
        'hover:shadow-md hover:ring-2', mod.ring)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center text-xl shadow-sm', mod.gradient)}>
          {mod.icon}
        </div>
        <span className={cn('text-xs font-semibold px-2 py-1 rounded-full',
          status.ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
          {status.label}
        </span>
      </div>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{mod.title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">{mod.desc}</p>
      <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
        Open Module <ChevronRight size={13} />
      </div>
    </motion.div>
  )
}

function PipelineStep({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all',
        done ? 'bg-emerald-500' : active ? 'bg-blue-500 animate-pulse' : 'bg-slate-200 dark:bg-slate-700')}>
        {done ? <CheckCircle2 size={12} className="text-white" /> : active ? <div className="w-2 h-2 bg-white rounded-full" /> : null}
      </div>
      <span className={cn('text-xs font-medium', done ? 'text-emerald-600 dark:text-emerald-400' : active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')}>{label}</span>
    </div>
  )
}

// ── Hero card ─────────────────────────────────────────────────────────────────
function HeroCard({ report, isDemo, onRun }: { report: PlacementReport; isDemo: boolean; onRun: () => void }) {
  const prob = report.placement_probability
  const pct = Math.round(prob * 100)
  const circ = 2 * Math.PI * 56
  const readiness = pct >= 80 ? 'Ready to Apply 🚀' : pct >= 65 ? 'Almost Ready ⚡' : pct >= 50 ? 'In Progress 📈' : 'Needs Work 🔧'
  const ringColor = pct >= 80 ? '#10b981' : pct >= 65 ? '#3b82f6' : pct >= 50 ? '#f59e0b' : '#ef4444'
  const glowColor = pct >= 80 ? 'shadow-emerald-500/30' : pct >= 65 ? 'shadow-blue-500/30' : pct >= 50 ? 'shadow-amber-500/30' : 'shadow-red-500/30'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-2xl overflow-hidden relative">
      {/* Multi-layer background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
      <div className="absolute inset-0 bg-grid opacity-[0.07]" />
      {/* Animated orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-blue-600/5 rounded-full blur-3xl" />

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">

          {/* ── Left: Score ring ── */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="relative">
              {/* Outer glow ring */}
              <div className={cn('absolute inset-0 rounded-full blur-xl opacity-40', glowColor)}
                style={{ background: ringColor, transform: 'scale(0.85)' }} />
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                  {/* Track */}
                  <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  {/* Glow track */}
                  <circle cx="64" cy="64" r="56" fill="none" stroke={ringColor} strokeWidth="8"
                    strokeOpacity="0.15" strokeDasharray={circ} strokeDashoffset="0" />
                  {/* Animated fill */}
                  <motion.circle cx="64" cy="64" r="56" fill="none" stroke={ringColor} strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - circ * prob }}
                    transition={{ duration: 1.8, delay: 0.3, ease: 'easeOut' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.p className="text-3xl font-black text-white leading-none tabular-nums"
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}>
                    {pct}%
                  </motion.p>
                  <p className="text-xs text-white/50 mt-0.5 font-medium">Readiness</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Placement Score</span>
                {isDemo && <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/40 border border-white/10">Demo</span>}
              </div>
              <motion.p className="text-5xl font-black text-white mb-3 tabular-nums"
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                {pct}<span className="text-2xl text-white/40">%</span>
              </motion.p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: `${ringColor}25`, border: `1px solid ${ringColor}50`, color: ringColor }}>
                  {readiness}
                </span>
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border',
                  report.risk_level === 'Low' ? 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300' :
                  report.risk_level === 'Medium' ? 'bg-amber-400/15 border-amber-400/30 text-amber-300' :
                  'bg-red-400/15 border-red-400/30 text-red-300')}>
                  {report.risk_level === 'Low' ? '✅' : report.risk_level === 'Medium' ? '⚠️' : '🚨'} {report.risk_level} Risk
                </span>
              </div>
            </div>
          </div>

          {/* ── Right: Module scores ── */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Consistency', value: report.consistency_score * 100, icon: '📈', color: '#8b5cf6' },
                { label: 'Resume ATS', value: report.resume_score * 100, icon: '📄', color: '#3b82f6' },
                { label: 'Internship', value: report.internship_score * 10, icon: '💼', color: '#10b981' },
                { label: 'Burnout', value: report.burnout_risk === 'Low' ? 90 : report.burnout_risk === 'Medium' ? 55 : 20, icon: '🧠', color: '#f59e0b' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="rounded-xl p-3 text-center" style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
                  <p className="text-lg mb-1">{s.icon}</p>
                  <p className="text-sm font-black text-white tabular-nums">{s.value.toFixed(0)}%</p>
                  <p className="text-xs mt-0.5" style={{ color: `${s.color}cc` }}>{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Segmented progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-white/40 mb-1">
                <span>Placement Readiness</span>
                <span>{pct}%</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden relative">
                {/* Background segments */}
                <div className="absolute inset-0 flex">
                  {[40, 60, 80, 100].map((mark, i) => (
                    <div key={i} className="flex-1 border-r border-white/5 last:border-0" />
                  ))}
                </div>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ background: `linear-gradient(90deg, ${ringColor}80, ${ringColor})` }}>
                  {/* Shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>
              </div>
              <div className="flex justify-between text-xs text-white/20">
                <span>Not Ready</span><span>Needs Work</span><span>Almost</span><span>Ready</span>
              </div>
            </div>

            {isDemo && (
              <button onClick={onRun}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <Zap size={14} /> Run Real Analysis
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
const PIPELINE_STEPS = ['Study Logs', 'Resume', 'Internship', 'Performance', 'Skill Gap', 'Generating Report']

export function DashboardPage() {
  const navigate = useNavigate()
  const report = useAnalysisStore(s => s.report)
  const isLoading = useAnalysisStore(s => s.isLoading)
  const error = useAnalysisStore(s => s.error)
  const user = useAuthStore(s => s.user)
  const [modalOpen, setModalOpen] = useState(false)
  const [streak] = useState(getStreak)
  const [pipelineStep, setPipelineStep] = useState(-1)
  const [activeInsightTab, setActiveInsightTab] = useState<'insights' | 'roadmap' | 'skills'>('insights')

  const displayReport = report ?? DEMO_REPORT
  const isDemo = !report

  // Simulate pipeline progress when loading
  useEffect(() => {
    if (isLoading) {
      setPipelineStep(0)
      const interval = setInterval(() => {
        setPipelineStep(s => s < PIPELINE_STEPS.length - 1 ? s + 1 : s)
      }, 800)
      return () => clearInterval(interval)
    } else {
      setPipelineStep(-1)
    }
  }, [isLoading])

  // Bump streak on load
  useEffect(() => { bumpStreak() }, [])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // Smart insights derived from report
  const insights = [
    displayReport.burnout_risk === 'High' ? '🚨 High burnout risk detected — reduce study hours and take breaks' : null,
    displayReport.resume_score < 0.6 ? `📄 Resume is your weakest link (${(displayReport.resume_score * 100).toFixed(0)}% ATS) — improve it first` : null,
    displayReport.missing_skills.length > 3 ? `🎯 You have ${displayReport.missing_skills.length} skill gaps — focus on: ${displayReport.missing_skills.slice(0, 2).join(', ')}` : null,
    displayReport.placement_probability >= 0.7 ? `✅ You are ${(displayReport.placement_probability * 100).toFixed(0)}% ready — start applying to companies now` : null,
    displayReport.placement_probability < 0.5 ? `⚠️ Placement readiness is low — prioritize DSA and resume improvement` : null,
    displayReport.consistency_score < 0.5 ? '📅 Inconsistent study pattern detected — aim for 3+ hours daily' : null,
    displayReport.internship_score >= 7 ? '💼 Strong internship profile — highlight this in your resume' : null,
  ].filter(Boolean) as string[]

  return (
    <div className="p-5 md:p-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {greeting}, {user?.name?.split(' ')[0] ?? 'Student'} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400">
              <Flame size={14} />
              <span className="text-xs font-bold">{streak} day streak</span>
            </div>
          )}
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-glow bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all">
            <PlayCircle size={16} />
            {isDemo ? 'Run My Analysis' : 'Re-run Analysis'}
          </button>
        </div>
      </div>

      {/* ── Pipeline loading overlay ── */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-5 bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-800/50 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Running Full Analysis Pipeline…</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PIPELINE_STEPS.map((step, i) => (
                <PipelineStep key={step} label={step} done={i < pipelineStep} active={i === pipelineStep} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ── */}
      {error && !isLoading && (
        <div className="mb-5 p-4 rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Analysis failed</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* ── Demo banner ── */}
      {isDemo && !isLoading && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 animated-gradient opacity-90" />
          <div className="relative z-10 flex items-center justify-between gap-4 p-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Preview Mode</span>
                <p className="text-xs text-white/70 mt-0.5">Run your first analysis to see real personalized insights</p>
              </div>
            </div>
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-600 text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0">
              <Zap size={14} /> Run My Analysis
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Loading skeletons ── */}
      {isLoading && (
        <div className="space-y-5">
          <Skeleton className="h-52 w-full rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      {!isLoading && (
        <div className="space-y-5">

          {/* Hero */}
          <HeroCard report={displayReport} isDemo={isDemo} onRun={() => setModalOpen(true)} />

          {/* ── Top stat cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Placement Score" value={`${(displayReport.placement_probability * 100).toFixed(0)}%`}
              sub={displayReport.risk_level + ' Risk'} icon={<Target size={18} />}
              color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              trend={isDemo ? undefined : 8} delay={0.05} />
            <StatCard label="ATS Score" value={`${(displayReport.resume_score * 100).toFixed(0)}%`}
              sub="Resume quality" icon={<FileText size={18} />}
              color="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
              trend={isDemo ? undefined : 5} delay={0.1} />
            <StatCard label="Consistency" value={`${(displayReport.consistency_score * 100).toFixed(0)}%`}
              sub="Study pattern" icon={<BarChart2 size={18} />}
              color="bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400"
              delay={0.15} />
            <StatCard label="Study Streak" value={`${streak}d`}
              sub={streak > 0 ? 'Keep it up!' : 'Start today'} icon={<Flame size={18} />}
              color="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
              delay={0.2} />
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm">📈</div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Study Consistency Trend</h3>
                </div>
                <span className={cn('text-xs font-semibold px-2 py-1 rounded-lg',
                  displayReport.consistency_score >= 0.7 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400')}>
                  {(displayReport.consistency_score * 100).toFixed(0)}%
                </span>
              </div>
              <ConsistencyLineChart consistencyScore={displayReport.consistency_score} burnoutRisk={displayReport.burnout_risk} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm">🎯</div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Skill Coverage</h3>
                </div>
                <span className="text-xs text-slate-400">{displayReport.missing_skills.length} gaps</span>
              </div>
              <SkillGapBarChart missingSkillsCount={displayReport.missing_skills.length}
                knownSkillsCount={Math.max(0, 10 - displayReport.missing_skills.length)} />
            </motion.div>
          </div>

          {/* ── Insight + Roadmap panel ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-slate-100 dark:border-slate-800">
              {([
                { key: 'insights', label: 'Smart Insights', icon: <Lightbulb size={13} /> },
                { key: 'roadmap', label: 'Learning Roadmap', icon: <Navigation size={13} /> },
                { key: 'skills', label: 'Skill Gaps', icon: <AlertCircle size={13} /> },
              ] as const).map(tab => (
                <button key={tab.key} onClick={() => setActiveInsightTab(tab.key)}
                  className={cn('flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all',
                    activeInsightTab === tab.key
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300')}>
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>
            <div className="p-5">
              <AnimatePresence mode="wait">
                {activeInsightTab === 'insights' && (
                  <motion.div key="ins" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    {insights.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">All systems looking good! Keep up the momentum.</p>
                      </div>
                    ) : insights.map((ins, i) => <InsightCard key={i} insight={ins} index={i} />)}
                  </motion.div>
                )}
                {activeInsightTab === 'roadmap' && (
                  <motion.div key="road" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {displayReport.roadmap.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-slate-400">Run analysis to generate your roadmap</p>
                        <button onClick={() => navigate('/roadmap-tool')}
                          className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                          Open Roadmap Generator →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {displayReport.roadmap.slice(0, 5).map((step, i) => (
                          <div key={step.skill} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                              i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400')}>
                              {step.priority}
                            </div>
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex-1">{step.skill}</span>
                            {step.resources[0] && (
                              <a href={step.resources[0]} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0">Resource →</a>
                            )}
                          </div>
                        ))}
                        <button onClick={() => navigate('/roadmap-tool')}
                          className="w-full mt-2 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          View Full Roadmap →
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
                {activeInsightTab === 'skills' && (
                  <motion.div key="skills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {displayReport.missing_skills.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">No skill gaps detected!</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{displayReport.missing_skills.length} skills to learn for your target role</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {displayReport.missing_skills.map(skill => (
                            <span key={skill} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/40">
                              {skill}
                            </span>
                          ))}
                        </div>
                        {displayReport.weak_areas.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Weak academic areas:</p>
                            <div className="flex flex-wrap gap-2">
                              {displayReport.weak_areas.map(area => (
                                <span key={area} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200/60 dark:border-red-800/40">
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Module cards ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">AI Modules</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Click any module for detailed analysis</p>
              </div>
              <button onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                <PlayCircle size={13} /> Run All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODULES.map((mod, i) => (
                <ModuleCard key={mod.href} mod={mod} report={displayReport} index={i} />
              ))}
            </div>
          </motion.div>

          {/* ── Bottom row: Wellbeing + Quick actions ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={15} className="text-purple-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Wellbeing Status</h3>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className={cn('badge', getRiskBgColor(displayReport.burnout_risk))}>
                  {displayReport.burnout_risk === 'Low' ? '😊' : displayReport.burnout_risk === 'Medium' ? '😐' : '😰'} Burnout: {displayReport.burnout_risk}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {displayReport.burnout_risk === 'Low' ? 'Your study habits are sustainable. Keep the balance.' :
                 displayReport.burnout_risk === 'Medium' ? 'Consider adding more breaks between study sessions.' :
                 'High burnout risk. Reduce intensity and rest more.'}
              </p>
              <button onClick={() => navigate('/burnout')}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                Analyze Burnout <ArrowRight size={11} />
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star size={15} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Analyze Resume', icon: '📄', href: '/resume', color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Run Failure Analysis', icon: '🔍', href: '/failure', color: 'text-orange-600 dark:text-orange-400' },
                  { label: 'Generate Roadmap', icon: '🗺️', href: '/roadmap-tool', color: 'text-teal-600 dark:text-teal-400' },
                  { label: 'Predict Placement', icon: '🎯', href: '/placement', color: 'text-blue-600 dark:text-blue-400' },
                ].map(action => (
                  <button key={action.href} onClick={() => navigate(action.href)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group">
                    <span className="text-base">{action.icon}</span>
                    <span className={cn('text-sm font-medium group-hover:underline', action.color)}>{action.label}</span>
                    <ChevronRight size={13} className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      )}

      <AnalyzeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
