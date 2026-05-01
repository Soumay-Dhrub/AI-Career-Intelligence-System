import React, { useRef, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { NotificationPanel } from '@/components/ui/NotificationPanel'
import { cn } from '@/lib/utils'

// ── NotificationBell ──────────────────────────────────────────────────────────
export function NotificationBell() {
  const user = useAuthStore((s) => s.user)
  const { notifications, fetch, reset, subscribeRealtime, openPanel, setOpenPanel } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (user?.id) {
      fetch()
    } else {
      reset()
    }
  }, [user?.id, fetch, reset])

  useEffect(() => {
    if (!user?.id) return
    const unsub = subscribeRealtime(user.id)
    return unsub
  }, [user?.id, subscribeRealtime])

  useEffect(() => {
    if (openPanel) {
      setOpen(true)
      setOpenPanel(false)
    }
  }, [openPanel, setOpenPanel])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative inline-flex" ref={wrapperRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'relative p-2 rounded-lg transition-all duration-200',
          open
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
        )}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && <NotificationPanel />}
    </div>
  )
}
