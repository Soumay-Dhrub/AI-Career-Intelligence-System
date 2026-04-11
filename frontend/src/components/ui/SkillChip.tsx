import React from 'react'
import { cn } from '@/lib/utils'

interface SkillChipProps {
  skill: string
  variant?: 'missing' | 'weak' | 'default'
}

export function SkillChip({ skill, variant = 'default' }: SkillChipProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border transition-all',
      variant === 'missing' && 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50',
      variant === 'weak' && 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
      variant === 'default' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
    )}>
      {skill}
    </span>
  )
}
