import React, { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, Sun, Moon, ChevronDown, LogOut, User, Sparkles, Edit, HelpCircle, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { useTheme } from '@/contexts/ThemeContext'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { NotificationBell } from '@/components/ui/NotificationBell'
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
  '/ai-chat': 'NextHire AI',
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const profileImage = useProfileStore((s) => s.profile.profile_image_url)
  const fetchProfile = useProfileStore((s) => s.fetchProfile)
  const profileLoaded = useProfileStore((s) => !!s.profile.email || !!s.profile.name)
  const openHelp = useOnboardingStore((s) => s.openHelp)
  const openTour = useOnboardingStore((s) => s.openTour)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [helpDropdownOpen, setHelpDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const helpRef = useRef<HTMLButtonElement>(null)
  const helpPanelRef = useRef<HTMLDivElement>(null)

  // Only fetch if profile not yet loaded
  useEffect(() => { if (user && !profileLoaded) fetchProfile() }, [user])

  const currentPage = PAGE_NAMES[location.pathname] ?? 'PlaceReady'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (helpPanelRef.current && !helpPanelRef.current.contains(e.target as Node) && helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpDropdownOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false)
        setHelpDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
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
        {/* Notification bell */}
        <NotificationBell />

        {/* Guidance help dropdown */}
        <div className="relative" ref={helpPanelRef}>
          <button
            ref={helpRef}
            onClick={() => setHelpDropdownOpen((prev) => !prev)}
            className={cn(
              'relative inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-200/80 bg-white/95 text-slate-600 shadow-sm shadow-slate-900/5 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-800/80 dark:bg-slate-900/95 dark:text-slate-200',
              'hover:-translate-y-0.5 hover:bg-white dark:hover:bg-slate-900',
              helpDropdownOpen && 'ring-2 ring-sky-400/40'
            )}
            aria-expanded={helpDropdownOpen}
            aria-haspopup="menu"
            aria-label="Open guide menu"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20">
              <HelpCircle size={20} />
            </div>
          </button>

          <AnimatePresence>
            {helpDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 top-full z-50 mt-3 w-[min(340px,calc(100vw-1rem))] max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[28px] border border-white/80 bg-white/95 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/95"
                role="menu"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Guide center</p>
                    <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">Quick access to guided help, walkthroughs, and support notes for your dashboard.</p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                    <Sparkles size={16} />
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  <button
                    onClick={() => {
                      openTour();
                      setHelpDropdownOpen(false);
                    }}
                    className="group flex items-center justify-between rounded-3xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-left transition-all duration-200 hover:border-sky-300 hover:bg-sky-50 dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-sky-500 dark:hover:bg-slate-900"
                    role="menuitem"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Start guided tour</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Step through the dashboard and learn each module fast.</p>
                    </div>
                    <ChevronDown size={18} className="text-slate-400 transition duration-200 group-hover:text-sky-600" />
                  </button>

                  <button
                    onClick={() => {
                      openHelp();
                      setHelpDropdownOpen(false);
                    }}
                    className="group flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white px-4 py-3 text-left transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800/80 dark:bg-slate-950/95 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                    role="menuitem"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Open full guide</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">View the complete platform walkthrough and help center.</p>
                    </div>
                    <ArrowRight size={18} className="text-slate-400 transition duration-200 group-hover:text-slate-600" />
                  </button>
                </div>

                <div className="mt-4 rounded-3xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/90 dark:text-slate-300">
                  <p className="font-semibold text-slate-900 dark:text-white">Tip</p>
                  <p className="mt-2 leading-6">Use the help center anytime to refresh your path, review module recommendations, or continue your placement readiness tour.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-sm shrink-0">
              {profileImage
                ? <img src={profileImage} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-white text-xs font-bold">{initials}</span>}
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
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shrink-0">
                    {profileImage
                      ? <img src={profileImage} alt="avatar" className="w-full h-full object-cover" />
                      : <span className="text-white text-sm font-bold">{initials}</span>}
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
                  <User size={15} /> View Profile
                </button>
                <button
                  onClick={() => { openTour(); setDropdownOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Sparkles size={15} /> Start Tour
                </button>
                <button
                  onClick={() => { navigate('/profile'); setDropdownOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Edit size={15} /> Edit Profile
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
