import React, { useState, useEffect, type ReactNode } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { GuidancePanel } from '@/components/guidance/GuidancePanel'
import { OnboardingTour } from '@/components/guidance/OnboardingTour'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { RoadmapPage } from '@/pages/RoadmapPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { BurnoutPage } from '@/pages/modules/BurnoutPage'
import { ResumePage } from '@/pages/modules/ResumePage'
import { InternshipPage } from '@/pages/modules/InternshipPage'
import { FailurePage } from '@/pages/modules/FailurePage'
import { RoadmapToolPage } from '@/pages/modules/RoadmapToolPage'
import { PlacementPage } from '@/pages/modules/PlacementPage'
import { FloatingChat } from '@/components/ui/FloatingChat'

// PrivateRoute: redirects unauthenticated users to /login
function PrivateRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// PublicRoute: redirects authenticated users to /dashboard
function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

// Page transition wrapper
function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}

// Layout shell wrapping protected pages
function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const loadOnboardingState = useOnboardingStore((s) => s.loadState)

  // Collapse sidebar on mobile by default
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setCollapsed(mq.matches)
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (isAuthenticated) loadOnboardingState()
  }, [isAuthenticated, loadOnboardingState])

  const sidebarWidth = collapsed ? 64 : 256

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Navbar onToggleSidebar={() => setCollapsed((v) => !v)} />
      <Sidebar collapsed={collapsed} />
      <main
        style={{ marginLeft: sidebarWidth, marginTop: 64 }}
        className="min-h-[calc(100vh-64px)] transition-all duration-200 overflow-y-auto"
      >
        {children}
      </main>
      <FloatingChat />
      <GuidancePanel />
      <OnboardingTour />
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <PageTransition>
                <LoginPage />
              </PageTransition>
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <PageTransition>
                <SignupPage />
              </PageTransition>
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppLayout>
                <PageTransition>
                  <DashboardPage />
                </PageTransition>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <AppLayout>
                <PageTransition>
                  <AnalyticsPage />
                </PageTransition>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/roadmap"
          element={
            <PrivateRoute>
              <AppLayout>
                <PageTransition>
                  <RoadmapPage />
                </PageTransition>
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <AppLayout>
                <PageTransition>
                  <ProfilePage />
                </PageTransition>
              </AppLayout>
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

        {/* Module routes */}
        <Route path="/burnout" element={<PrivateRoute><AppLayout><PageTransition><BurnoutPage /></PageTransition></AppLayout></PrivateRoute>} />
        <Route path="/resume" element={<PrivateRoute><AppLayout><PageTransition><ResumePage /></PageTransition></AppLayout></PrivateRoute>} />
        <Route path="/internship" element={<PrivateRoute><AppLayout><PageTransition><InternshipPage /></PageTransition></AppLayout></PrivateRoute>} />
        <Route path="/failure" element={<PrivateRoute><AppLayout><PageTransition><FailurePage /></PageTransition></AppLayout></PrivateRoute>} />
        <Route path="/roadmap-tool" element={<PrivateRoute><AppLayout><PageTransition><RoadmapToolPage /></PageTransition></AppLayout></PrivateRoute>} />
        <Route path="/placement" element={<PrivateRoute><AppLayout><PageTransition><PlacementPage /></PageTransition></AppLayout></PrivateRoute>} />
      </Routes>
    </AnimatePresence>
  )
}
