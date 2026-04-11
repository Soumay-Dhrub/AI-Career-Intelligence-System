import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, BarChart2, Map, User,
  Brain, FileText, Briefcase, AlertTriangle, Navigation, Target, Sparkles,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface SidebarProps { collapsed: boolean }

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/roadmap', label: 'Roadmap', icon: Map },
  { to: '/profile', label: 'Profile', icon: User },
]

const moduleNav = [
  { to: '/burnout', label: 'Burnout & Consistency', icon: Brain, emoji: '🧠', color: 'text-purple-400' },
  { to: '/resume', label: 'Resume Analyzer', icon: FileText, emoji: '📄', color: 'text-blue-400' },
  { to: '/internship', label: 'Internship Predictor', icon: Briefcase, emoji: '💼', color: 'text-green-400' },
  { to: '/failure', label: 'Failure Analysis', icon: AlertTriangle, emoji: '🔍', color: 'text-orange-400' },
  { to: '/roadmap-tool', label: 'Roadmap Generator', icon: Navigation, emoji: '🗺️', color: 'text-teal-400' },
  { to: '/placement', label: 'Placement Predictor', icon: Target, emoji: '🎯', color: 'text-blue-400' },
]

function NavItem({ to, label, icon: Icon, collapsed, emoji, color }: {
  to: string
  label: string
  icon: React.ElementType
  collapsed: boolean
  emoji?: string
  color?: string
}) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
        isActive
          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-100'
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
      )}

      {collapsed && emoji ? (
        <span className="text-base w-5 text-center shrink-0">{emoji}</span>
      ) : (
        <Icon
          size={17}
          className={cn(
            'shrink-0 transition-colors',
            isActive
              ? 'text-blue-600 dark:text-blue-400'
              : cn(color ?? 'text-slate-400', 'group-hover:text-slate-600 dark:group-hover:text-slate-300')
          )}
        />
      )}

      {!collapsed && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="text-sm font-medium whitespace-nowrap truncate"
        >
          {label}
        </motion.span>
      )}
    </NavLink>
  )
}

export function Sidebar({ collapsed }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full z-30 flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 shrink-0 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shrink-0 shadow-glow-brand">
            <Sparkles size={15} className="text-white" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              <p className="font-black text-sm gradient-text whitespace-nowrap leading-tight">PlaceReady</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">AI Placement System</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {!collapsed && (
          <p className="section-label px-3 mb-2 mt-1">Main</p>
        )}
        {mainNav.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}

        <div className="pt-3 pb-1">
          {!collapsed ? (
            <p className="section-label px-3 mb-2">AI Modules</p>
          ) : (
            <div className="mx-3 h-px bg-slate-200 dark:bg-slate-700/60 mb-2" />
          )}
        </div>

        {moduleNav.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </div>

      {/* User card */}
      <div className="border-t border-slate-200/80 dark:border-slate-800/80 shrink-0">
        {!collapsed && user ? (
          <div className="p-3 flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        ) : collapsed && user ? (
          <div className="p-3 flex justify-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          </div>
        ) : null}
      </div>
    </motion.aside>
  )
}
