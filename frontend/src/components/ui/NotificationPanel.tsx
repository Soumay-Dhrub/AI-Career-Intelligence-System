import React from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, Loader2, BellOff } from 'lucide-react'
import { useNotificationStore } from '@/stores/notificationStore'
import { NotificationItem } from '@/components/ui/NotificationItem'
import { cn } from '@/lib/utils'

export function NotificationPanel() {
  const { notifications, loading, markRead, markAllRead } = useNotificationStore()
  const unread = notifications.filter(n => !n.is_read).length

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(
        'absolute right-0 top-full mt-2 z-50',
        'w-[360px] max-sm:w-[calc(100vw-1.5rem)] max-sm:right-0',
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-700/80',
        'rounded-3xl shadow-2xl overflow-hidden'
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-blue-600/10 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-300">
            <Bell size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {unread > 0 ? `${unread} unread notification${unread === 1 ? '' : 's'}` : 'All caught up'}
            </p>
          </div>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200"
            type="button"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[420px] overflow-y-auto bg-white dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-5 text-center gap-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
              <BellOff size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No notifications yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your login and module updates will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onRead={markRead} />
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            {notifications.length} total notification{notifications.length === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </motion.div>
  )
}
