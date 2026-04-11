import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, Sun, Moon, ChevronDown, LogOut, User, Sparkles, Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

interface NavbarProps {
  onToggleSidebar: () => void
}

const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/roadmap': 'Roadmap',
  '/profile': 'Profile',
  '/burnout': 'Burnout & Consistency',
  '/resume': 'Resume Analyzer',
  '/internship': 'Internship Predictor',
  '/failure': 'Failure Analysis',
  '/roadmap-tool': 'Roadmap Generator',
  '/placement': 'Placement Predictor',
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentPage = PAGE_NAMES[location.pathname] ?? 'PlaceReady'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-40 flex items-center px-4 gap-3
      bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
      border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm">

      {/* Hamburger */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Logo (desktop) */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-sm">
          <Sparkles size={14} className="text-white" />
        </div>
        <span className="font-black text-sm gradient-text">PlaceReady</span>
      </div>

      {/* Breadcrumb — center */}
      <div className="hidden md:flex flex-1 items-center justify-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60">
          <span className="text-xs text-slate-400 dark:text-slate-500">PlaceReady</span>
          <span className="text-xs text-slate-300 dark:text-slate-600">/</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{currentPage}</span>
        </div>
      </div>

      <div className="flex-1 md:hidden" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Notification bell (decorative) */}
        <button
          className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200 relative"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all duration-200"
          aria-label="Toggle theme"
        >
          {theme === 'dark'
            ? <Sun size={18} className="text-yellow-400" />
            : <Moon size={18} />}
        </button>

        {/* User dropdown */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-all duration-200',
              'hover:bg-slate-100 dark:hover:bg-slate-800',
              dropdownOpen && 'bg-slate-100 dark:bg-slate-800'
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight max-w-[100px] truncate">
                {user?.name ?? 'User'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight max-w-[100px] truncate">
                {user?.email ?? ''}
              </p>
            </div>
            <ChevronDown size={14} className={cn('text-slate-400 transition-transform duration-200', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-card-hover py-2 z-50 overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-sm font-bold">{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name ?? 'User'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email ?? ''}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { navigate('/profile'); setDropdownOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <User size={15} /> My Profile
                </button>
                <div className="mx-4 my-1 h-px bg-slate-100 dark:bg-slate-800" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
