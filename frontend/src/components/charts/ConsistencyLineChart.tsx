import React from 'react'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts'

interface ConsistencyLineChartProps {
  consistencyScore: number
  burnoutRisk: 'Low' | 'Medium' | 'High'
}

function generateTrendData(consistencyScore: number) {
  const target = consistencyScore * 100
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((day, i) => {
    const progress = i / (days.length - 1)
    const noise = (Math.random() - 0.5) * 10
    const value = Math.max(0, Math.min(100, target * progress + noise + target * 0.3))
    return { day, score: Math.round(value) }
  })
}

interface TooltipPayload {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-card text-xs">
      <p className="text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className="font-semibold text-blue-600 dark:text-blue-400">{payload[0].value}%</p>
    </div>
  )
}

export function ConsistencyLineChart({ consistencyScore }: ConsistencyLineChartProps) {
  const data = React.useMemo(() => generateTrendData(consistencyScore), [consistencyScore])

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="consistencyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          axisLine={false}
          tickLine={false}
          className="text-slate-400 dark:text-slate-500"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: 'currentColor' }}
          axisLine={false}
          tickLine={false}
          className="text-slate-400 dark:text-slate-500"
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#2563EB"
          strokeWidth={2.5}
          fill="url(#consistencyGradient)"
          dot={false}
          activeDot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
