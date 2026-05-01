import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/stores/notificationStore'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const TYPE_CONFIG = {
  login:       { icon: '🎉', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  module:      { icon: '✅', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  achievement: { icon: '🎯', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  system:      { icon: '🔔', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
}

interface NotificationItemProps {
  notification: AppNotification
  onRead: (id: string) => void
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 0 }}
      onClick={() => !notification.is_read && onRead(notification.id)}
      className={cn(
        'w-full text-left flex gap-3 px-4 py-3 transition-colors rounded-3xl',
        notification.is_read
          ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
          : 'bg-blue-50/70 dark:bg-blue-900/15 hover:bg-blue-50 dark:hover:bg-blue-900/25'
      )}
    >
      <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0', cfg.color)}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-semibold leading-tight', notification.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white')}>
            {notification.title}
          </p>
          {!notification.is_read && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5" />}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed break-words">
          {notification.message}
        </p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mt-2">
          {timeAgo(notification.created_at)}
        </p>
      </div>
    </motion.button>
  )
}
