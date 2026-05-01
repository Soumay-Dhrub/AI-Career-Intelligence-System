import React from 'react'
import { motion } from 'framer-motion'
import { LoginCard } from '@/components/ui/LoginCard'
import { LoginForm } from '@/components/forms/LoginForm'
import { FeatureItem } from '@/components/ui/FeatureItem'
import { Sparkles, TrendingUp, Shield, Zap, BookOpen, ClipboardCheck, Cpu, Star } from 'lucide-react'

const STATS = [
  { value: '94%', label: 'Placement Rate' },
  { value: '10K+', label: 'Active Students' },
  { value: '6', label: 'AI Modules' },
]

const FEATURES = [
  { icon: TrendingUp, title: 'Real-time placement probability' },
  { icon: Shield, title: 'Burnout risk detection' },
  { icon: Zap, title: 'Personalized AI roadmap' },
  { icon: BookOpen, title: 'Resume strength score' },
  { icon: ClipboardCheck, title: 'Interview readiness checklist' },
  { icon: Cpu, title: 'Role-match skill insights' },
]

const COMPANY_LOGOS = [
  { name: 'Google' },
  { name: 'Amazon' },
  { name: 'Meta' },
  { name: 'Microsoft' },
]

export function LoginPage() {

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      <div className="relative flex-1 hidden lg:flex items-center justify-center overflow-hidden bg-slate-950 border-r border-slate-800/70">
        <div className="absolute inset-0 mesh-bg opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-slate-900/95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_24%)]" />

        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
          className="relative z-10 max-w-2xl px-12 py-20"
        >
          <div className="mb-8 flex flex-col gap-6 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900/70 border border-slate-700/60 shadow-[0_20px_70px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                <Sparkles size={22} className="text-sky-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">AI Placement Intelligence</p>
                <p className="text-base font-semibold text-slate-200">Built for ambitious students and career teams.</p>
              </div>
            </div>

            <h1 className="text-5xl xl:text-6xl font-black leading-tight tracking-[-0.05em] text-white">
              Land your dream
              <span className="block bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
                Placement
              </span>
              with confidence.
            </h1>

            <p className="max-w-xl text-base leading-8 text-slate-300/95">
              Transform your application strategy with AI-powered resume scoring, interview readiness, and skill gap analysis tailored to top-tier placement outcomes.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.15 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {FEATURES.slice(0, 4).map((feature, index) => (
              <FeatureItem key={index} icon={feature.icon} title={feature.title} />
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.2 }}
            className="mt-10 grid grid-cols-3 gap-4"
          >
            {STATS.map((stat, index) => (
              <div key={index} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl text-center">
                <p className="stat-number text-4xl font-black text-white">{stat.value}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.24em] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.3 }}
            className="mt-10 grid gap-4"
          >
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 backdrop-blur-xl shadow-[0_28px_60px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300/80">Student success story</p>
                  <p className="mt-3 text-lg font-black text-white">“PlaceReady helped me focus on the right skills and land an offer in record time.”</p>
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-3 text-sky-300 shadow-inner shadow-slate-950/30">
                  <Star size={18} className="text-sky-300" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300/85">Rahul Sharma • Placed at Google</p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {COMPANY_LOGOS.map((logo, index) => (
                <div
                  key={index}
                  className="group flex h-12 items-center justify-center rounded-3xl border border-slate-700/60 bg-slate-950/80 text-slate-400 transition hover:border-sky-400/40 hover:text-white hover:shadow-[0_14px_40px_rgba(14,165,233,0.12)]"
                >
                  <span className="text-xs uppercase tracking-[0.22em] font-semibold">{logo.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <div className="pointer-events-none absolute inset-0 opacity-70">
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-16 left-16 h-60 w-60 rounded-full bg-sky-500/10 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, 28, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-20 right-16 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl"
          />
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center px-6 py-10 sm:px-10 sm:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.1),_transparent_22%)]" />
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" />
        <div className="relative z-10 w-full max-w-xl space-y-6">
          <LoginCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-300/80">Welcome back</p>
                  <h2 className="mt-3 text-3xl font-black text-white">Sign in to continue your AI placement experience.</h2>
                </div>
                <div className="rounded-3xl bg-slate-900/75 px-3 py-2 text-xs uppercase tracking-[0.3em] text-sky-300/85">
                  Secure access
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-300/85">
                Access your dashboard, resume insights, and placement roadmap with a login experience designed for premium conversion.
              </p>
            </div>

            <div className="mt-8">
              <LoginForm />
            </div>
          </LoginCard>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {FEATURES.slice(4).map((feature, index) => (
              <FeatureItem key={index} icon={feature.icon} title={feature.title} small />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
