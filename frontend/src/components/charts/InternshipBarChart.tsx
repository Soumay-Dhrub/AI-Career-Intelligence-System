import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'

interface InternshipBarChartProps {
  internshipScore: number
  placementBoost: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-card text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-0.5">{label}</p>
      <p className="text-slate-500 dark:text-slate-400">{payload[0].value.toFixed(2)}</p>
    </div>
  )
}

export function InternshipBarChart({ internshipScore, placementBoost }: InternshipBarChartProps) {
  const data = [
    { name: 'Internship Score', value: internshipScore, color: '#2563EB' },
    { name: 'Placement Boost', value: placementBoost * 100, color: '#10B981' },
  ]

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          axisLine={false}
          tickLine={false}
          className="text-slate-400 dark:text-slate-500"
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'currentColor' }}
          axisLine={false}
          tickLine={false}
          className="text-slate-400 dark:text-slate-500"
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
