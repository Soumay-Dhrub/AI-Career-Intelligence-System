import React from 'react'
import { motion } from 'framer-motion'
import { LoginForm } from '@/components/forms/LoginForm'
import { Sparkles, TrendingUp, Shield, Zap } from 'lucide-react'

const STATS = [
  { value: '94%', label: 'Placement Rate' },
  { value: '10K+', label: 'Students' },
  { value: '6', label: 'AI Modules' },
]

const FEATURES = [
  { icon: <TrendingUp size={15} />, text: 'Real-time placement probability' },
  { icon: <Shield size={15} />, text: 'Burnout risk detection' },
  { icon: <Zap size={15} />, text: 'Personalized AI roadmap' },
]

export function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* ── Left hero panel ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80')` }}
        />
        {/* Deep blue gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-sky-900 opacity-90" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-20" />

        {/* Animated orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-sky-400/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Sparkles size={20} className="text-blue-300" />
            </div>
            <div>
              <p className="font-black text-lg leading-tight">PlaceReady</p>
              <p className="text-xs text-blue-300">AI Placement System</p>
            </div>
          </div>

          {/* Main copy */}
          <div className="max-w-md">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-medium mb-6">
                <Sparkles size={12} />
                AI-Powered Career Intelligence
              </div>
              <h1 className="text-4xl font-black leading-tight mb-4">
                Land Your Dream
                <span className="block gradient-text">Placement</span>
                with AI Insights
              </h1>
              <p className="text-blue-200 text-base leading-relaxed mb-8">
                Get personalized analysis across 6 AI modules — from resume scoring to burnout detection — all in one intelligent dashboard.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-10">
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 text-sm text-blue-100"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/25 border border-blue-400/20 flex items-center justify-center text-blue-300 shrink-0">
                      {f.icon}
                    </div>
                    {f.text}
                  </motion.div>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-0">
                {STATS.map((s, i) => (
                  <React.Fragment key={i}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="text-center px-6 first:pl-0"
                    >
                      <p className="text-2xl font-black text-white">{s.value}</p>
                      <p className="text-xs text-blue-300 mt-0.5">{s.label}</p>
                    </motion.div>
                    {i < STATS.length - 1 && (
                      <div className="w-px h-8 bg-white/15" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom testimonial glass card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="glass rounded-2xl p-4 max-w-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                alt="Student"
                className="w-9 h-9 rounded-full object-cover border-2 border-white/20"
              />
              <div>
                <p className="text-xs font-semibold text-white">Rahul Sharma</p>
                <p className="text-xs text-blue-300">Placed at Google</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xs">★</span>
                ))}
              </div>
            </div>
            <p className="text-xs text-blue-200 leading-relaxed">
              "PlaceReady's AI roadmap helped me identify exactly what skills I was missing. Got placed in 3 months!"
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-40 dark:opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <p className="font-black text-lg gradient-text">PlaceReady</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
            {/* Blue top accent border */}
            <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500" />

            {/* Card header */}
            <div className="px-8 pt-7 pb-5">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Welcome back 👋</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to your PlaceReady account</p>
            </div>

            <div className="divider mx-8" />

            {/* Form */}
            <div className="px-8 py-6">
              <LoginForm />
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-5">
            By signing in, you agree to our{' '}
            <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">Terms</span> and{' '}
            <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
