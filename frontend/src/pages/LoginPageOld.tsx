import React from 'react'
import { motion } from 'framer-motion'
import { LoginForm } from '@/components/forms/LoginForm'
import { AboutSection } from '@/components/ui/AboutSection'
import { ContactSection } from '@/components/ui/ContactSection'
import { Sparkles, TrendingUp, Shield, Zap, Star, Users, Cpu } from 'lucide-react'

const STATS = [
  { value: '94%', label: 'Placement Rate' },
  { value: '10K+', label: 'Students' },
  { value: '6', label: 'AI Modules' },
]

const FEATURES = [
  { icon: TrendingUp, text: 'Real-time placement probability' },
  { icon: Shield, text: 'Burnout risk detection' },
  { icon: Zap, text: 'Personalized AI roadmap' },
]

const COMPANY_LOGOS = [
  { name: 'Google' },
  { name: 'Amazon' },
  { name: 'Meta' },
  { name: 'Microsoft' },
]

export function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Main Hero + Login Section */}
      <div className="min-h-screen flex relative">
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(56,189,248,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(59,130,246,0.08),transparent_50%)]" />

        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 bg-[length:400%_400%]"
          />
        </div>

        {/* ── Left hero panel ── */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60" />

          {/* Floating orbs with enhanced animation */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-cyan-400/15 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 15, 0],
              x: [0, -15, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
            className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-br from-purple-500/15 to-pink-400/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-sky-500/10 to-blue-600/8 rounded-full blur-3xl"
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full">
            {/* Enhanced Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 border border-white/20 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <p className="font-black text-xl leading-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  PlaceReady
                </p>
                <p className="text-sm text-blue-300/80 font-medium">AI Placement Intelligence</p>
              </div>
            </motion.div>

            {/* Enhanced Main copy */}
            <div className="max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {/* Premium badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-400/20 border border-blue-400/30 text-blue-200 text-sm font-semibold mb-8 shadow-lg backdrop-blur-sm"
                >
                  <Sparkles size={14} className="text-blue-300" />
                  AI-Powered Career Intelligence
                </motion.div>

                {/* Enhanced heading */}
                <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight">
                  Land Your Dream
                  <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
                    Placement
                  </span>
                  <span className="block text-2xl lg:text-3xl font-bold text-blue-300/90 mt-2">
                    with AI Insights
                  </span>
                </h1>

                <p className="text-lg text-blue-100/90 leading-relaxed mb-10 max-w-md">
                  Get personalized analysis across 6 AI modules — from resume scoring to burnout detection — all in one intelligent dashboard designed for ambitious students.
                </p>

                {/* Enhanced Features */}
                <div className="space-y-4 mb-12">
                  {FEATURES.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.15 }}
                      whileHover={{ x: 8 }}
                      className="flex items-center gap-4 text-base text-blue-100 group cursor-default"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-400/20 border border-blue-400/30 flex items-center justify-center text-blue-300 group-hover:shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                        <f.icon size={18} />
                      </div>
                      <span className="group-hover:text-white transition-colors duration-300">{f.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Enhanced Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="flex items-center gap-8 mb-8"
                >
                  {STATS.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.4 + i * 0.1 }}
                      className="text-center group"
                    >
                      <div className="text-4xl font-black text-white mb-1 group-hover:text-blue-300 transition-colors duration-300">
                        {s.value}
                      </div>
                      <div className="text-sm text-blue-300/70 font-medium uppercase tracking-wide">
                        {s.label}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Company logos */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                  className="flex items-center gap-6"
                >
                  <span className="text-sm text-blue-300/60 font-medium">Trusted by teams at</span>
                  <div className="flex gap-4">
                    {COMPANY_LOGOS.map((logo, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 + i * 0.1 }}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-wide hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                      >
                        {logo.name}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Enhanced testimonial card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="max-w-md"
            >
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-400/5 rounded-2xl" />
                <div className="relative flex items-start gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face"
                    alt="Student"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/30 shadow-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-white text-sm">Rahul Sharma</span>
                      <span className="text-blue-300 text-xs">• Placed at Google</span>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className="text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-blue-100/90 leading-relaxed">
                      "PlaceReady's AI roadmap helped me identify exactly what skills I was missing. Got placed in 3 months!"
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16 relative">
          {/* Enhanced background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-slate-950/80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),transparent_70%)]" />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Mobile logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-3 mb-10 lg:hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 border border-white/20 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <p className="font-black text-lg bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  PlaceReady
                </p>
                <p className="text-xs text-blue-300/80">AI Placement System</p>
              </div>
            </motion.div>

            {/* Premium Glassmorphism Login Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative group"
            >
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-blue-600/20 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Card */}
              <div className="relative bg-white/10 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-slate-950/50 overflow-hidden">
                {/* Top accent gradient */}
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />

                {/* Card content */}
                <div className="p-8 lg:p-10">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="text-3xl font-black text-white mb-2"
                    >
                      Welcome back
                      <span className="text-2xl">👋</span>
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="text-slate-300 text-base"
                    >
                      Sign in to your PlaceReady account
                    </motion.p>
                  </div>

                  {/* Form */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <LoginForm />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center text-sm text-slate-400 mt-8 max-w-sm"
            >
              By signing in, you agree to our{' '}
              <span className="text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
                Terms
              </span>{' '}
              and{' '}
              <span className="text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
                Privacy Policy
              </span>
            </motion.p>
          </motion.div>
        </div>
      </div>

      <AboutSection />
      <ContactSection />
    </div>
  )
}
