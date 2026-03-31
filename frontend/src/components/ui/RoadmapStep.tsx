import React from 'react'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoadmapStepProps {
  skill: string
  priority: number
  resources: string[]
  isTop: boolean
  animationDelay: number
  'data-testid'?: string
  'data-priority'?: number
}

export function RoadmapStep({ skill, priority, resources, isTop, animationDelay, ...rest }: RoadmapStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
      className="flex gap-4 mb-4"
      data-testid={rest['data-testid']}
      data-priority={rest['data-priority']}
    >
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 shadow-sm',
          isTop
            ? 'bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-glow-brand'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        )}>
          {priority}
        </div>
        <div className="w-px flex-1 bg-gradient-to-b from-blue-500/30 to-transparent mt-2 min-h-[20px]" />
      </div>

      {/* Content card */}
      <div className={cn(
        'flex-1 rounded-2xl border p-4 mb-2 transition-all card-hover',
        isTop
          ? 'border-blue-300/60 dark:border-blue-700/60 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20'
          : 'border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900'
      )}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className={cn(
            'text-sm font-bold',
            isTop ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'
          )}>
            {skill}
          </p>
          {isTop && (
            <span className="badge bg-blue-600 text-white shrink-0">
              Top Priority
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {resources.map((r, i) => (
            <a
              key={i}
              href={r}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all hover:-translate-y-0.5',
                isTop
                  ? 'text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-700/40 bg-white/60 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/40'
                  : 'text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
              )}
            >
              <ExternalLink size={11} />
              Resource {i + 1}
            </a>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
