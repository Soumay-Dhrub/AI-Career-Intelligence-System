import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800',
        className
      )}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.06) 50%, transparent 100%)',
        }}
      />
    </div>
  )
}
