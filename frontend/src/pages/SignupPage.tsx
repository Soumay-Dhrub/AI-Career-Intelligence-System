import React from 'react'
import { motion } from 'framer-motion'
import { SignupForm } from '@/components/forms/SignupForm'
import { Sparkles, Target } from 'lucide-react'

const MODULES = [
  { icon: '🧠', label: 'Burnout Analysis', color: 'bg-purple-500/20 border-purple-400/20 text-purple-200' },
  { icon: '📄', label: 'Resume Scorer', color: 'bg-blue-500/20 border-blue-400/20 text-blue-200' },
  { icon: '💼', label: 'Internship Predictor', color: 'bg-green-500/20 border-green-400/20 text-green-200' },
  { icon: '🔍', label: 'Failure Analysis', color: 'bg-orange-500/20 border-orange-400/20 text-orange-200' },
  { icon: '🗺️', label: 'Roadmap Generator', color: 'bg-teal-500/20 border-teal-400/20 text-teal-200' },
  { icon: '🎯', label: 'Placement Predictor', color: 'bg-blue-500/20 border-blue-400/20 text-blue-200' },
]

export function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* ── Left hero panel ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-sky-900 opacity-90" />
        <div className="absolute inset-0 bg-grid opacity-20" />

        {/* Orbs */}
        <div className="absolute top-32 right-20 w-56 h-56 bg-sky-500/15 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-32 left-10 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

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

          <div className="max-w-md">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-medium mb-6">
                <Target size={12} />
                6 AI-Powered Modules
              </div>
              <h1 className="text-4xl font-black leading-tight mb-4">
                Your Complete
                <span className="block gradient-text">Career Intelligence</span>
                Platform
              </h1>
              <p className="text-blue-200 text-base leading-relaxed mb-8">
                Six specialized AI modules working together to give you a 360° view of your placement readiness.
              </p>

              {/* Module grid */}
              <div className="grid grid-cols-2 gap-3">
                {MODULES.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className={`glass rounded-xl p-3 flex items-center gap-2.5 border ${m.color}`}
                  >
                    <span className="text-base w-7 text-center shrink-0">{m.icon}</span>
                    <span className="text-xs font-medium text-white/90">{m.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
              ].map((src, i) => (
                <img key={i} src={src} alt="" className="w-8 h-8 rounded-full border-2 border-blue-900 object-cover" />
              ))}
            </div>
            <p className="text-sm text-blue-200">
              <span className="font-bold text-white">10,000+</span> students already placed
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-40 dark:opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />

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

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
            {/* Blue top accent border */}
            <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500" />

            <div className="px-8 pt-7 pb-5">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create account 🚀</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Start your placement journey today</p>
            </div>

            <div className="divider mx-8" />

            <div className="px-8 py-6">
              <SignupForm />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
