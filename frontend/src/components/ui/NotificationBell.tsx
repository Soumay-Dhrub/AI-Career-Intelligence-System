import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCheck, Loader2, BellOff } from 'lucide-react'
import { useNotificationStore } from '@/stores/notificationStore'
import { cn } from '@/lib/utils'

// ── Time ago helper ───────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  login:       { icon: '🎉', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  module:      { icon: '✅', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
  achievement: { icon: '🎯', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
  system:      { icon: '🔔', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
}

// ── NotificationItem ──────────────────────────────────────────────────────────
function NotificationItem({ n, onRead }: {
  n: { id: string; title: string; message: string; type: string; is_read: boolean; created_at: string }
  onRead: (id: string) => void
}) {
  const cfg = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.system
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => !n.is_read && onRead(n.id)}
      className={cn(
        'flex gap-3 px-4 py-3 cursor-pointer transition-colors',
        n.is_read
          ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
          : 'bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
      )}
    >
      {/* Icon */}
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 mt-0.5', cfg.color)}>
        {cfg.icon}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-semibold leading-tight', n.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white')}>
            {n.title}
          </p>
          {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.created_at)}</p>
      </div>
    </motion.div>
  )
}

// ── NotificationBell ──────────────────────────────────────────────────────────
export function NotificationBell() {
  const { notifications, loading, fetch, markRead, markAllRead, subscribeRealtime } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.is_read).length

  // Fetch + subscribe on mount
  useEffect(() => {
    fetch()
    const unsub = subscribeRealtime()
    return unsub
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'relative p-2 rounded-lg transition-all duration-200',
          open
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
        )}
        aria-label="Notifications"
      >
        <Bell size={18} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute right-0 top-full mt-2 z-50',
              'w-[360px] max-sm:w-[calc(100vw-2rem)] max-sm:right-0',
              'bg-white dark:bg-slate-900',
              'border border-slate-200 dark:border-slate-700/80',
              'rounded-2xl shadow-2xl overflow-hidden',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</span>
                {unread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-slate-400" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <BellOff size={28} className="text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No notifications yet</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">You'll see updates here as you use PlaceReady</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.map(n => (
                    <NotificationItem key={n.id} n={n} onRead={markRead} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
