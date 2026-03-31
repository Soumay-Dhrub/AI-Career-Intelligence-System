import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  PlayCircle, Activity, BookOpen, Briefcase, RefreshCw,
  Sparkles, CheckCircle2, AlertCircle, ArrowRight, Zap,
} from 'lucide-react'
import { useAnalysisStore } from '@/stores/analysisStore'
import { MetricCard } from '@/components/ui/MetricCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConsistencyLineChart } from '@/components/charts/ConsistencyLineChart'
import { SkillGapBarChart } from '@/components/charts/SkillGapBarChart'
import { AnalyzeModal } from '@/components/forms/AnalyzeModal'
import { useAuthStore } from '@/stores/authStore'
import { cn, formatPercent, getRiskBgColor } from '@/lib/utils'
import { DEMO_REPORT } from '@/lib/demoData'
import type { PlacementReport } from '@/types/api'

const MODULE_CARDS = [
  { title: 'Burnout & Consistency', desc: 'Analyze study patterns', icon: '🧠', href: '/burnout', gradient: 'from-purple-500 to-violet-600', border: 'border-purple-200 dark:border-purple-800/40', bg: 'bg-purple-50 dark:bg-purple-900/10' },
  { title: 'Resume Analyzer', desc: 'Score vs job descriptions', icon: '📄', href: '/resume', gradient: 'from-blue-500 to-cyan-500', border: 'border-blue-200 dark:border-blue-800/40', bg: 'bg-blue-50 dark:bg-blue-900/10' },
  { title: 'Internship Predictor', desc: 'Evaluate experience impact', icon: '💼', href: '/internship', gradient: 'from-green-500 to-emerald-500', border: 'border-green-200 dark:border-green-800/40', bg: 'bg-green-50 dark:bg-green-900/10' },
  { title: 'Failure Analysis', desc: 'Identify weak areas', icon: '🔍', href: '/failure', gradient: 'from-orange-500 to-red-500', border: 'border-orange-200 dark:border-orange-800/40', bg: 'bg-orange-50 dark:bg-orange-900/10' },
  { title: 'Roadmap Generator', desc: 'Personalized learning path', icon: '🗺️', href: '/roadmap-tool', gradient: 'from-teal-500 to-cyan-500', border: 'border-teal-200 dark:border-teal-800/40', bg: 'bg-teal-50 dark:bg-teal-900/10' },
  { title: 'Placement Predictor', desc: 'Final probability score', icon: '🎯', href: '/placement', gradient: 'from-blue-600 to-sky-500', border: 'border-blue-200 dark:border-blue-800/40', bg: 'bg-blue-50 dark:bg-blue-900/10' },
]

function DemoBanner({ onRun }: { onRun: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl overflow-hidden relative"
    >
      <div className="absolute inset-0 animated-gradient opacity-90" />
      <div className="relative z-10 flex items-center justify-between gap-4 p-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="badge bg-white/20 text-white text-xs">Preview Mode</span>
            </div>
            <p className="text-xs text-white/70">Run your first analysis to see your real placement score</p>
          </div>
        </div>
        <button
          onClick={onRun}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-600 text-sm font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 shrink-0"
        >
          <Zap size={15} />
          Run My Analysis
        </button>
      </div>
    </motion.div>
  )
}

function HeroCard({ report, isDemo }: { report: PlacementReport; isDemo: boolean }) {
  const prob = report.placement_probability
  const circumference = 2 * Math.PI * 54
  const strokeDash = circumference * prob

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl overflow-hidden shadow-card relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-sky-700" />
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-400/20 rounded-full blur-3xl" />

      {/* Student image */}
      <div className="absolute right-0 bottom-0 h-full w-64 overflow-hidden opacity-15 hidden md:block">
        <img
          src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80"
          alt=""
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-transparent" />
      </div>

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Left: circular progress + probability */}
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="54" fill="none"
                  stroke="white" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - strokeDash }}
                  transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-black text-white leading-none">{Math.round(prob * 100)}%</p>
                <p className="text-xs text-white/60 mt-0.5">Ready</p>
              </div>
            </div>

            <div>
              <p className="text-white/60 text-sm font-medium mb-1">Placement Probability</p>
              <p className="text-4xl font-black text-white mb-2">{formatPercent(prob)}</p>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
                report.risk_level === 'Low' ? 'bg-green-400/20 border-green-300/30 text-green-200' :
                report.risk_level === 'Medium' ? 'bg-yellow-400/20 border-yellow-300/30 text-yellow-200' :
                'bg-red-400/20 border-red-300/30 text-red-200'
              )}>
                {report.risk_level === 'Low' ? '✅' : report.risk_level === 'Medium' ? '⚠️' : '🚨'}
                {report.risk_level} Risk
              </span>
              {isDemo && <p className="text-white/40 text-xs mt-2">Sample data</p>}
            </div>
          </div>

          {/* Right: mini stat chips */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Consistency', value: formatPercent(report.consistency_score), icon: '📈' },
              { label: 'Resume', value: formatPercent(report.resume_score), icon: '📄' },
              { label: 'Internship', value: `${report.internship_score.toFixed(1)}/10`, icon: '💼' },
              { label: 'Burnout', value: report.burnout_risk, icon: report.burnout_risk === 'Low' ? '😊' : '😐' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-3 text-center min-w-[90px]">
                <p className="text-lg mb-0.5">{s.icon}</p>
                <p className="text-sm font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-white/50 mb-1.5">
            <span>Placement Readiness</span>
            <span>{formatPercent(prob)}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${prob * 100}%` }}
              transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full progress-bar"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function DashboardPage() {
  const report = useAnalysisStore((s) => s.report)
  const isLoading = useAnalysisStore((s) => s.isLoading)
  const error = useAnalysisStore((s) => s.error)
  const user = useAuthStore((s) => s.user)
  const [modalOpen, setModalOpen] = useState(false)

  const displayReport = report ?? DEMO_REPORT
  const isDemo = !report

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="p-5 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {greeting}, {user?.name?.split(' ')[0] ?? 'Student'} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{dateStr}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-glow bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          <PlayCircle size={16} />
          {isDemo ? 'Run My Analysis' : 'Re-run Analysis'}
        </button>
      </div>

      {/* Demo banner */}
      {isDemo && <DemoBanner onRun={() => setModalOpen(true)} />}

      {/* Error */}
      {error && !isLoading && (
        <div className="mb-6 p-4 rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 flex items-center justify-between">
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

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-5">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="space-y-5">
          {/* Hero card */}
          <HeroCard report={displayReport} isDemo={isDemo} />

          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard label="Consistency Score" value={displayReport.consistency_score} format="percent"
              description="Study consistency over tracked period" icon={<Activity size={17} />} delay={0.1} />
            <MetricCard label="Resume Score" value={displayReport.resume_score} format="percent"
              description="Resume match against target roles" icon={<BookOpen size={17} />} delay={0.2} />
            <MetricCard label="Internship Score" value={displayReport.internship_score} format="score"
              description="Internship quality and relevance" icon={<Briefcase size={17} />} delay={0.3} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm">📈</div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Study Consistency</h3>
              </div>
              <ConsistencyLineChart consistencyScore={displayReport.consistency_score} burnoutRisk={displayReport.burnout_risk} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm">🎯</div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Skill Gap</h3>
              </div>
              <SkillGapBarChart missingSkillsCount={displayReport.missing_skills.length}
                knownSkillsCount={Math.max(0, 10 - displayReport.missing_skills.length)} />
            </motion.div>
          </div>

          {/* Insights row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={15} className="text-orange-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Skills to Learn</h3>
                <span className="ml-auto badge bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                  {displayReport.missing_skills.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayReport.missing_skills.slice(0, 6).map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/40">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={15} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Wellbeing Status</h3>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span className={cn('badge', getRiskBgColor(displayReport.burnout_risk))}>
                  {displayReport.burnout_risk === 'Low' ? '😊' : displayReport.burnout_risk === 'Medium' ? '😐' : '😰'} Burnout: {displayReport.burnout_risk}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {displayReport.burnout_risk === 'Low' ? 'Great! Your study habits are sustainable.' :
                 displayReport.burnout_risk === 'Medium' ? 'Consider balancing your schedule.' :
                 'High burnout risk. Take breaks and reassess.'}
              </p>
            </motion.div>
          </div>

          {/* AI Modules grid */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">AI Modules</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Run independently for detailed insights</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODULE_CARDS.map((mod, i) => (
                <motion.a
                  key={mod.href}
                  href={mod.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 + i * 0.05 }}
                  className={cn(
                    'group rounded-2xl border p-4 flex items-center gap-4 card-hover cursor-pointer no-underline',
                    mod.border, mod.bg
                  )}
                >
                  <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shrink-0 shadow-sm', mod.gradient)}>
                    {mod.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {mod.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mod.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      <AnalyzeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
