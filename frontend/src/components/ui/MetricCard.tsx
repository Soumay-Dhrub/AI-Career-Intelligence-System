import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn, formatPercent, formatScore } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: number
  format?: 'percent' | 'score' | 'raw'
  description?: string
  icon?: React.ReactNode
  trend?: number
  delay?: number
  colorBorder?: string
}

function formatValue(value: number, format?: string): string {
  if (format === 'percent') return formatPercent(value)
  if (format === 'score') return formatScore(value)
  return value.toFixed(2)
}

function getScoreColor(value: number, format?: string): string {
  const normalized = format === 'score' ? value / 10 : value
  if (normalized >= 0.7) return 'text-emerald-500'
  if (normalized >= 0.4) return 'text-amber-500'
  return 'text-red-500'
}

function getBarColor(value: number, format?: string): string {
  const normalized = format === 'score' ? value / 10 : value
  if (normalized >= 0.7) return 'bg-gradient-to-r from-emerald-400 to-green-500'
  if (normalized >= 0.4) return 'bg-gradient-to-r from-amber-400 to-orange-400'
  return 'bg-gradient-to-r from-red-400 to-rose-500'
}

function getBorderColor(value: number, format?: string): string {
  const normalized = format === 'score' ? value / 10 : value
  if (normalized >= 0.7) return 'border-l-emerald-400'
  if (normalized >= 0.4) return 'border-l-amber-400'
  return 'border-l-red-400'
}

export function MetricCard({ label, value, format, description, icon, trend, delay = 0 }: MetricCardProps) {
  const normalized = format === 'score' ? value / 10 : value
  const pct = Math.round(normalized * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
      className={cn(
        'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5',
        'border-l-[3px]',
        getBorderColor(value, format),
        'transition-shadow duration-250 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg',
            trend >= 0
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          )}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <p className={cn('text-3xl font-black stat-number mb-0.5', getScoreColor(value, format))}>
        {formatValue(value, format)}
      </p>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      {description && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">{description}</p>
      )}

      {/* Mini progress bar */}
      <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: 'easeOut' }}
          className={cn('h-full rounded-full', getBarColor(value, format))}
        />
      </div>
    </motion.div>
  )
}
