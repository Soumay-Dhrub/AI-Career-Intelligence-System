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

interface SkillGapBarChartProps {
  missingSkillsCount: number
  knownSkillsCount: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-card text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-0.5">{label}</p>
      <p className="text-slate-500 dark:text-slate-400">{payload[0].value} skills</p>
    </div>
  )
}

export function SkillGapBarChart({ missingSkillsCount, knownSkillsCount }: SkillGapBarChartProps) {
  const data = [
    { name: 'Known Skills', count: knownSkillsCount, color: '#2563EB' },
    { name: 'Missing Skills', count: missingSkillsCount, color: '#EF4444' },
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
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
