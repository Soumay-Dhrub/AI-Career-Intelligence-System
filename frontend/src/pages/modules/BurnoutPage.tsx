import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Loader2, Clock, Moon, Coffee, BookOpen, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import { useNotify } from '@/hooks/useNotify'
import { cn } from '@/lib/utils'
import type { BurnoutResponse, DailyScheduleInput } from '@/types/api'

// ── Types ─────────────────────────────────────────────────────────────────────
type DailySchedule = DailyScheduleInput

// ── Helpers ───────────────────────────────────────────────────────────────────
function totalHours(s: DailySchedule) {
  return s.study_hours + s.sleep_hours + s.college_hours + s.break_hours + s.other_hours
}

const RISK_CONFIG = {
  Low:    { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-500', emoji: '😊', label: 'Low Risk' },
  Medium: { color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20',   bar: 'bg-amber-500',   emoji: '😐', label: 'Medium Risk' },
  High:   { color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20',       bar: 'bg-red-500',     emoji: '😰', label: 'High Risk' },
}

const CATEGORY_COLORS: Record<string, string> = {
  study:   'bg-blue-500',
  break:   'bg-emerald-500',
  sleep:   'bg-indigo-500',
  college: 'bg-purple-500',
  other:   'bg-slate-400',
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SliderRow({
  icon, label, value, max, color, onChange,
}: {
  icon: React.ReactNode; label: string; value: number; max: number; color: string; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          {icon}
          <span>{label}</span>
        </div>
        <span className={cn('text-sm font-bold tabular-nums', color)}>{value}h</span>
      </div>
      <input
        type="range" min={0} max={max} step={0.5} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn('w-full h-2 rounded-full appearance-none cursor-pointer', color.replace('text-', 'accent-'))}
        style={{ accentColor: undefined }}
      />
    </div>
  )
}

function EmotionTagBadge({ tag }: { tag: { label: string; confidence: number } }) {
  const colorMap: Record<string, string> = {
    stressed:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    motivated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    anxious:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    burnout:   'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    neutral:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', colorMap[tag.label] ?? colorMap.neutral)}>
      {tag.label}
      <span className="opacity-60">{Math.round(tag.confidence * 100)}%</span>
    </span>
  )
}

function TimelineBlock({ block }: { block: { start: string; end: string; activity: string; category: string } }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="text-xs text-slate-400 dark:text-slate-500 w-20 shrink-0 tabular-nums">
        {block.start} – {block.end}
      </div>
      <div className={cn('w-2 h-2 rounded-full shrink-0', CATEGORY_COLORS[block.category] ?? 'bg-slate-400')} />
      <span className="text-sm text-slate-700 dark:text-slate-300">{block.activity}</span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function BurnoutPage() {
  const toast = useToast()
  const notify = useNotify()
  // Study log state
  const [numDays, setNumDays] = useState(14)
  const [hours, setHours] = useState<number[]>(Array(14).fill(5))

  // 24h schedule state
  const [schedule, setSchedule] = useState<DailySchedule>({
    study_hours: 6, sleep_hours: 8, college_hours: 4, break_hours: 2, other_hours: 4,
  })
  const [mood, setMood] = useState('')
  const [result, setResult] = useState<BurnoutResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)

  const total = totalHours(schedule)
  const totalOk = Math.abs(total - 24) < 0.1

  function updateSchedule(key: keyof DailySchedule, val: number) {
    setSchedule((prev) => ({ ...prev, [key]: val }))
  }

  function handleDaysChange(n: number) {
    setNumDays(n)
    setHours((prev) => Array(n).fill(0).map((_, i) => prev[i] ?? 5))
  }

  async function handleSubmit() {
    if (hours.length < 7) { toast.error('Need at least 7 days of data'); return }

    setLoading(true)
    try {
      const today = new Date()
      const dates = Array.from({ length: numDays }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (numDays - 1 - i))
        return d.toISOString().split('T')[0]
      })

      const payload = {
        study_log: { daily_hours: hours, dates },
        ...(totalOk ? { daily_schedule: schedule } : {}),
        ...(mood.trim() ? { mood_description: mood.trim() } : {}),
      }

      const res = await api.burnoutAnalysis(payload)
      setResult(res.data as BurnoutResponse)
      toast.success('Analysis complete!')
      notify.moduleComplete('Burnout & Consistency')
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const risk = result ? RISK_CONFIG[result.burnout_risk] : null

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xl">🧠</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Burnout & Consistency</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Intelligent analysis of your study patterns and wellbeing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Input Panel ── */}
        <div className="space-y-4">
          {/* Study log card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BookOpen size={15} className="text-purple-500" /> Study Log
            </h2>

            {/* Days slider */}
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-600 dark:text-slate-400">Days to analyze</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{numDays} days</span>
              </div>
              <input type="range" min={7} max={30} value={numDays}
                onChange={(e) => handleDaysChange(Number(e.target.value))}
                className="w-full accent-purple-500" />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>7</span><span>30</span></div>
            </div>

            {/* Daily hours grid */}
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Daily study hours</p>
              <div className="grid grid-cols-7 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {hours.map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-400">D{i + 1}</span>
                    <input type="number" min={0} max={24} value={h}
                      onChange={(e) => { const u = [...hours]; u[i] = Number(e.target.value); setHours(u) }}
                      className="w-full px-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 24h schedule card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
            <button onClick={() => setShowSchedule(!showSchedule)}
              className="w-full flex items-center justify-between text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
              <span className="flex items-center gap-2"><Clock size={15} className="text-blue-500" /> Daily Schedule (24h split)</span>
              {showSchedule ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {/* Total indicator */}
            <div className={cn('text-xs font-medium mb-3', totalOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
              Total: {total.toFixed(1)}h / 24h {totalOk ? '✓' : '— must equal 24h'}
            </div>

            <AnimatePresence>
              {showSchedule && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="space-y-4 overflow-hidden">
                  <SliderRow icon={<BookOpen size={13} />} label="Study" value={schedule.study_hours} max={16} color="text-blue-600" onChange={(v) => updateSchedule('study_hours', v)} />
                  <SliderRow icon={<Moon size={13} />} label="Sleep" value={schedule.sleep_hours} max={12} color="text-indigo-600" onChange={(v) => updateSchedule('sleep_hours', v)} />
                  <SliderRow icon={<Zap size={13} />} label="College" value={schedule.college_hours} max={10} color="text-purple-600" onChange={(v) => updateSchedule('college_hours', v)} />
                  <SliderRow icon={<Coffee size={13} />} label="Breaks" value={schedule.break_hours} max={6} color="text-emerald-600" onChange={(v) => updateSchedule('break_hours', v)} />
                  <SliderRow icon={<Clock size={13} />} label="Other" value={schedule.other_hours} max={8} color="text-slate-500" onChange={(v) => updateSchedule('other_hours', v)} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Mood input */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <span>💬</span> How are you feeling today?
            </h2>
            <textarea value={mood} onChange={(e) => setMood(e.target.value)} rows={3}
              placeholder="Describe how you feel today... e.g. 'I feel exhausted and overwhelmed with deadlines'"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none transition-all" />
          </motion.div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-sm">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
            {loading ? 'Analyzing your patterns…' : 'Analyze Burnout Risk'}
          </button>
        </div>

        {/* ── Results Panel ── */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-8 flex flex-col items-center justify-center text-center h-64">
                <span className="text-5xl mb-3">🧠</span>
                <p className="text-sm text-slate-400 dark:text-slate-500">Fill in your details and click Analyze to get your personalized burnout assessment</p>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                {/* Burnout risk card */}
                <div className={cn('rounded-2xl border p-5', risk!.bg, 'border-transparent')}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Burnout Risk</span>
                    <span className="text-2xl">{risk!.emoji}</span>
                  </div>
                  <p className={cn('text-3xl font-black mb-2', risk!.color)}>{risk!.label}</p>
                  <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${result.burnout_level * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', risk!.bar)} />
                  </div>
                  <p className="text-xs mt-2 text-slate-600 dark:text-slate-400">{result.insights}</p>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Consistency</p>
                    <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{(result.consistency_score * 100).toFixed(0)}%</p>
                    <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${result.consistency_score * 100}%` }}
                        transition={{ duration: 0.7 }} className="h-full bg-purple-500 rounded-full" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Rest Efficiency</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{(result.rest_efficiency * 100).toFixed(0)}%</p>
                    <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${result.rest_efficiency * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.1 }} className="h-full bg-blue-500 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Flags */}
                {(result.overwork_detected || result.sleep_deprivation_detected) && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 flex gap-3 flex-wrap">
                    {result.overwork_detected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium">
                        ⚡ Overwork detected
                      </span>
                    )}
                    {result.sleep_deprivation_detected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                        😴 Sleep deprivation
                      </span>
                    )}
                  </div>
                )}

                {/* Emotion analysis */}
                {result.emotion_analysis && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Mood Analysis</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{result.emotion_analysis.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {result.emotion_analysis.tags?.map((tag: { label: string; confidence: number }, i: number) => (
                        <EmotionTagBadge key={i} tag={tag} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Recommendations</p>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {rec}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Optimized schedule */}
                {result.optimized_schedule && result.optimized_schedule.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Optimized Schedule</p>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                        <span key={cat} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className={cn('w-2 h-2 rounded-full', color)} />{cat}
                        </span>
                      ))}
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {result.optimized_schedule.map((block, i) => (
                        <TimelineBlock key={i} block={block} />
                      ))}
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
