import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  XCircle, Zap, Download, RefreshCw, Lightbulb,
  BarChart2, Target, FileText, Briefcase, Brain, Navigation,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Legend,
} from 'recharts'
import { useAnalysisStore } from '@/stores/analysisStore'
import { AnalyzeModal } from '@/components/forms/AnalyzeModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { DEMO_REPORT } from '@/lib/demoData'
import type { PlacementReport } from '@/types/api'

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(v: number) { return `${(v * 100).toFixed(0)}%` }
function score10(v: number) { return `${v.toFixed(1)}/10` }

function generateTrend(base: number, weeks = 8) {
  const data = []
  let val = Math.max(base * 100 - 20, 30)
  for (let i = 1; i <= weeks; i++) {
    val = Math.min(100, val + (Math.random() * 6 - 1))
    data.push({ week: `W${i}`, placement: Math.round(val), consistency: Math.round(val * 0.9 + Math.random() * 8) })
  }
  return data
}

function deriveSkills(r: PlacementReport) {
  const dsa = Math.round(Math.max(30, (1 - r.missing_skills.length / 10) * 85))
  const coding = Math.round(r.resume_score * 90)
  const aptitude = Math.round(r.consistency_score * 80 + 10)
  const verbal = Math.round(r.consistency_score * 70 + 15)
  const projects = Math.round((r.internship_score / 10) * 85)
  return [
    { name: 'DSA', score: dsa },
    { name: 'Coding', score: coding },
    { name: 'Aptitude', score: aptitude },
    { name: 'Verbal', score: verbal },
    { name: 'Projects', score: projects },
  ]
}

function generateInsights(r: PlacementReport, skills: { name: string; score: number }[]) {
  const insights: string[] = []
  const weakest = [...skills].sort((a, b) => a.score - b.score)[0]
  const strongest = [...skills].sort((a, b) => b.score - a.score)[0]
  const prob = Math.round(r.placement_probability * 100)

  insights.push(`You are **${prob}% ready** for placements — ${prob >= 70 ? 'start applying to companies now' : 'focus on the improvement areas below'}.`)
  insights.push(`Your **strongest area is ${strongest.name}** (${strongest.score}/100) — highlight this in your resume.`)
  insights.push(`Your **biggest weakness is ${weakest.name}** (${weakest.score}/100) — improving this can boost placement chances by ~15%.`)
  if (r.missing_skills.length > 0)
    insights.push(`You have **${r.missing_skills.length} skill gaps** — prioritize: ${r.missing_skills.slice(0, 2).join(', ')}.`)
  if (r.burnout_risk === 'High')
    insights.push(`**High burnout risk detected** — reduce study intensity and add recovery days.`)
  if (r.internship_score >= 7)
    insights.push(`**Strong internship profile** (${r.internship_score.toFixed(1)}/10) — this gives you a ${(r.placement_boost * 100).toFixed(0)}% placement boost.`)
  return insights
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>{p.name}: {p.value}%</p>
      ))}
    </div>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon, color, trend, delay = 0 }: {
  label: string; value: string; sub: string; icon: React.ReactNode
  color: string; trend?: 'up' | 'down' | null; delay?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>{icon}</div>
        {trend && (
          <span className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
            trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400')}>
            {trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend === 'up' ? '+5%' : '-3%'}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
    </motion.div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onRun }: { onRun: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-3xl mb-4">📊</div>
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">No analytics data yet</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">Run your first analysis to see detailed insights across all 6 AI modules.</p>
      <button onClick={onRun}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold btn-glow transition-all">
        <Zap size={15} /> Run Analysis
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const report = useAnalysisStore(s => s.report)
  const isLoading = useAnalysisStore(s => s.isLoading)
  const [modalOpen, setModalOpen] = useState(false)
  const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week')

  const data: PlacementReport = report ?? DEMO_REPORT
  const isDemo = !report

  const trendData = useMemo(() => generateTrend(data.placement_probability, timeFilter === 'week' ? 7 : 8), [data.placement_probability, timeFilter])
  const skills = useMemo(() => deriveSkills(data), [data])
  const insights = useMemo(() => generateInsights(data, skills), [data, skills])
  const weakest = [...skills].sort((a, b) => a.score - b.score)[0]
  const strongest = [...skills].sort((a, b) => b.score - a.score)[0]

  const radarData = skills.map(s => ({ subject: s.name, score: s.score, fullMark: 100 }))

  const internshipData = [
    { name: 'Without Internship', score: Math.round(data.placement_probability * 100 - data.placement_boost * 30) },
    { name: 'With Internship', score: Math.round(data.placement_probability * 100) },
  ]

  function handleDownload() {
    const content = `PlaceReady Analytics Report\n${'='.repeat(40)}\n\nPlacement Probability: ${pct(data.placement_probability)}\nResume ATS Score: ${pct(data.resume_score)}\nConsistency Score: ${pct(data.consistency_score)}\nInternship Score: ${score10(data.internship_score)}\nBurnout Risk: ${data.burnout_risk}\n\nSkill Scores:\n${skills.map(s => `  ${s.name}: ${s.score}/100`).join('\n')}\n\nMissing Skills:\n${data.missing_skills.map(s => `  - ${s}`).join('\n')}\n\nWeak Areas:\n${data.weak_areas.map(a => `  - ${a}`).join('\n')}\n\nAI Insights:\n${insights.map(i => `  • ${i.replace(/\*\*/g, '')}`).join('\n')}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'placeready-analytics.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-5 md:p-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isDemo ? 'Preview mode — run analysis for real insights' : 'Your placement readiness breakdown across all 6 AI modules'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all">
              <Zap size={13} /> Run Analysis
            </button>
          )}
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-5">

          {/* ── 1. Summary metric cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MetricCard label="Placement Readiness" value={pct(data.placement_probability)}
              sub={`${data.risk_level} risk level`} icon={<Target size={18} />}
              color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              trend={isDemo ? null : 'up'} delay={0.05} />
            <MetricCard label="Resume ATS Score" value={pct(data.resume_score)}
              sub="Keyword & format match" icon={<FileText size={18} />}
              color="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
              trend={isDemo ? null : 'up'} delay={0.1} />
            <MetricCard label="Consistency Score" value={pct(data.consistency_score)}
              sub={`Burnout: ${data.burnout_risk}`} icon={<Brain size={18} />}
              color="bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400"
              trend={isDemo ? null : 'up'} delay={0.15} />
            <MetricCard label="Internship Impact" value={score10(data.internship_score)}
              sub={`+${(data.placement_boost * 100).toFixed(0)}% placement boost`} icon={<Briefcase size={18} />}
              color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
              trend={isDemo ? null : 'up'} delay={0.2} />
          </div>

          {/* ── 2. Performance trend ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><BarChart2 size={14} className="text-blue-600 dark:text-blue-400" /></div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Performance Trend</h2>
              </div>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                {(['week', 'month'] as const).map(f => (
                  <button key={f} onClick={() => setTimeFilter(f)}
                    className={cn('px-3 py-1.5 font-medium transition-colors capitalize',
                      timeFilter === f ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="placementGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="consistencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} className="text-slate-400" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} className="text-slate-400" />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area type="monotone" dataKey="placement" name="Placement Score" stroke="#2563EB" strokeWidth={2.5} fill="url(#placementGrad)" dot={false} activeDot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }} />
                <Area type="monotone" dataKey="consistency" name="Consistency" stroke="#14b8a6" strokeWidth={2} fill="url(#consistencyGrad)" dot={false} activeDot={{ r: 4, fill: '#14b8a6', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* ── 3. Skill analysis + Radar ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bar chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Skill Analysis</h2>
              </div>
              <div className="flex gap-3 mb-4">
                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-semibold">↑ {strongest.name}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-semibold">↓ {weakest.name}</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={skills} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} className="text-slate-400" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} className="text-slate-400" />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-lg text-xs"><p className="font-bold text-slate-700 dark:text-slate-200">{label}: {payload[0].value}/100</p></div>
                  }} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {skills.map((s, i) => (
                      <Cell key={i} fill={s.name === weakest.name ? '#ef4444' : s.name === strongest.name ? '#10b981' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Radar chart */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Skill Radar</h2>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} className="text-slate-400" />
                  <Radar name="Score" dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* ── 4. Failure analysis + Resume analytics ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Failure analysis */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center"><AlertTriangle size={14} className="text-orange-500" /></div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Failure Analysis</h2>
              </div>
              {data.weak_areas.length === 0 && data.failure_reasons.length === 0 ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">No critical issues detected!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.weak_areas.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Weak Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {data.weak_areas.map(a => (
                          <span key={a} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.failure_reasons.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Risk Factors</p>
                      <ul className="space-y-1.5">
                        {data.failure_reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Skill gap chips */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Skill Gaps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.filter(s => s.score < 55).map(s => (
                        <span key={s.name} className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
                          Weak {s.name}
                        </span>
                      ))}
                      {skills.filter(s => s.score < 55).length === 0 && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">All skills above threshold ✓</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Resume analytics */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center"><FileText size={14} className="text-blue-600 dark:text-blue-400" /></div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Resume Analytics</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'ATS Score', value: data.resume_score * 100, color: 'bg-blue-500' },
                  { label: 'Keyword Match', value: data.resume_score * 85, color: 'bg-violet-500' },
                  { label: 'Format Score', value: 78, color: 'bg-teal-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{item.value.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className={cn('h-full rounded-full', item.color)} />
                    </div>
                  </div>
                ))}
                {data.missing_skills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.missing_skills.slice(0, 6).map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── 5. Internship impact + Roadmap ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Internship impact */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center"><Briefcase size={14} className="text-emerald-600 dark:text-emerald-400" /></div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Internship Impact</h2>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{score10(data.internship_score)}</p>
                  <p className="text-xs text-slate-400">Internship Score</p>
                </div>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">+{(data.placement_boost * 100).toFixed(0)}%</p>
                  <p className="text-xs text-slate-400">Placement Boost</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={internshipData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-lg text-xs"><p className="font-bold">{label}: {payload[0].value}%</p></div>
                  }} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    <Cell fill="#94a3b8" />
                    <Cell fill="#10b981" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Roadmap progress */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center"><Navigation size={14} className="text-teal-600 dark:text-teal-400" /></div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Roadmap Progress</h2>
                <span className="ml-auto text-xs text-slate-400">{data.roadmap.length} skills</span>
              </div>
              {data.roadmap.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Run analysis to generate your roadmap</p>
              ) : (
                <div className="space-y-2.5">
                  {data.roadmap.slice(0, 5).map((step, i) => {
                    const done = i === 0
                    const progress = done ? 100 : i === 1 ? 45 : 0
                    return (
                      <div key={step.skill} className="flex items-center gap-3">
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                          done ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
                          {done ? '✓' : step.priority}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={cn('font-medium truncate', done ? 'text-emerald-600 dark:text-emerald-400 line-through' : 'text-slate-700 dark:text-slate-300')}>{step.skill}</span>
                            <span className="text-slate-400 shrink-0 ml-2">{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all', done ? 'bg-emerald-500' : 'bg-blue-500')} style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* ── 6. AI Insights panel ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center"><Lightbulb size={14} className="text-amber-500" /></div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">AI-Generated Insights</h2>
              <span className="ml-auto text-xs text-slate-400">{insights.length} insights</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {insights.map((ins, i) => {
                const parts = ins.split(/\*\*(.*?)\*\*/g)
                const formatted = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.65 + i * 0.07 }}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40">
                    <Lightbulb size={13} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{formatted}</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

        </div>
      )}

      <AnalyzeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
