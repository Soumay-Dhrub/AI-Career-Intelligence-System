import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToastItem } from '@/contexts/ToastContext'

interface ToastProps {
  toast: ToastItem
  onDismiss: (id: string) => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.25 }}
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg text-sm min-w-[280px] max-w-sm',
        toast.variant === 'success'
          ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200'
          : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200'
      )}
    >
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}
