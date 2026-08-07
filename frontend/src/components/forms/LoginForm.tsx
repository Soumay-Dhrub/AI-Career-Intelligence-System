import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, Eye, EyeOff, ArrowRight, Mail, Lock, Chrome } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const googleLogin = useAuthStore((s) => s.googleLogin)
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  })

  const emailValue = watch('email')
  const passwordValue = watch('password')

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true)
    try {
      await login({ email: values.email, password: values.password }, values.remember ?? false)
      navigate('/dashboard')
    } catch (err: unknown) {
      const message = (err as { message?: string }).message ?? 'Login failed. Please try again.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    try {
      await googleLogin()
      // Supabase redirects to /dashboard automatically
    } catch (err: unknown) {
      const message = (err as { message?: string }).message ?? 'Google sign-in failed.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── PREMIUM GOOGLE SIGN-IN BUTTON ── */}
      <motion.button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
        whileHover={{
          scale: 1.02,
          y: -3,
          transition: { duration: 0.2, ease: 'easeOut' }
        }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'w-full relative group overflow-hidden',
          'bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/30',
          'rounded-2xl py-4 px-6 text-white font-semibold text-base',
          'shadow-lg shadow-slate-950/20 hover:shadow-xl hover:shadow-slate-950/30',
          'backdrop-blur-sm transition-all duration-300',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400'
        )}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-blue-500/5 group-hover:to-blue-500/10 transition-all duration-500" />

        {/* Shine effect */}
        <div className="absolute inset-0 -left-full group-hover:left-full bg-white/10 w-full h-full transition-all duration-700 ease-out" />

        <div className="relative z-10 flex items-center justify-center gap-4">
          <div className="w-6 h-6 flex items-center justify-center">
            <Chrome size={20} className="text-white" />
          </div>
          <span className="font-semibold">Continue with Google</span>
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
      </motion.button>

      {/* ── PREMIUM DIVIDER ── */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative flex items-center gap-4 py-2"
      >
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-medium text-indigo-300/70 bg-slate-900/80 px-4 py-1 rounded-full border border-indigo-400/20 backdrop-blur-sm"
        >
          or continue with email
        </motion.span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
      </motion.div>

      {/* ── ENHANCED FORM ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* ── EMAIL FIELD ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <label className="block text-sm font-bold text-indigo-200/90 tracking-wide uppercase">
            Email Address
          </label>
          <div className="relative group">
            {/* Animated background glow */}
            <div className={cn(
              'absolute inset-0 rounded-2xl opacity-0 transition-all duration-300',
              'bg-gradient-to-r from-indigo-500/20 via-blue-500/15 to-purple-500/20',
              focusedField === 'email' && 'opacity-100',
              errors.email && 'from-red-500/20 via-red-500/15 to-red-500/20'
            )} />

            {/* Input field */}
            <div className="relative">
              <input
                type="email"
                autoComplete="email"
                {...register('email')}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className={cn(
                  'w-full relative z-10 bg-white/5 border-2 rounded-2xl px-5 py-4 pr-12',
                  'text-white placeholder-indigo-300/50 font-medium',
                  'backdrop-blur-sm transition-all duration-300',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'border-white/20 focus:border-indigo-400',
                  errors.email && 'border-red-400/60 focus:border-red-400 focus:ring-red-500/30',
                  focusedField === 'email' && 'shadow-2xl shadow-indigo-500/20',
                  'hover:border-white/30'
                )}
                placeholder="you@company.com"
              />

              {/* Email icon */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                <Mail size={18} className={cn(
                  'transition-colors duration-300',
                  focusedField === 'email' ? 'text-indigo-300' : 'text-indigo-400/60',
                  errors.email && 'text-red-400'
                )} />
              </div>

              {/* Focus ring animation */}
              <motion.div
                animate={focusedField === 'email' ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 rounded-2xl border-2 border-indigo-400/50 pointer-events-none"
              />
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {errors.email && (
              <motion.p
                id="email-error"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="text-sm font-medium text-red-400 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                {errors.email.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── PASSWORD FIELD ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-indigo-200/90 tracking-wide uppercase">
              Password
            </label>
            <Link
              to="#"
              className="text-sm font-semibold text-indigo-300 hover:text-white transition-colors duration-200 hover:underline underline-offset-2"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative group">
            {/* Animated background glow */}
            <div className={cn(
              'absolute inset-0 rounded-2xl opacity-0 transition-all duration-300',
              'bg-gradient-to-r from-indigo-500/20 via-blue-500/15 to-purple-500/20',
              focusedField === 'password' && 'opacity-100',
              errors.password && 'from-red-500/20 via-red-500/15 to-red-500/20'
            )} />

            {/* Input field */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className={cn(
                  'w-full relative z-10 bg-white/5 border-2 rounded-2xl px-5 py-4 pr-12',
                  'text-white placeholder-indigo-300/50 font-medium',
                  'backdrop-blur-sm transition-all duration-300',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'border-white/20 focus:border-indigo-400',
                  errors.password && 'border-red-400/60 focus:border-red-400 focus:ring-red-500/30',
                  focusedField === 'password' && 'shadow-2xl shadow-indigo-500/20',
                  'hover:border-white/30'
                )}
                placeholder="••••••••"
              />

              {/* Password toggle */}
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-1 rounded-lg hover:bg-white/10 transition-colors duration-200"
              >
                <AnimatePresence mode="wait">
                  {showPassword ? (
                    <motion.div
                      key="hide"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <EyeOff size={18} className={cn(
                        'transition-colors duration-300',
                        focusedField === 'password' ? 'text-indigo-300' : 'text-indigo-400/60',
                        errors.password && 'text-red-400'
                      )} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="show"
                      initial={{ opacity: 0, rotate: 90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Eye size={18} className={cn(
                        'transition-colors duration-300',
                        focusedField === 'password' ? 'text-indigo-300' : 'text-indigo-400/60',
                        errors.password && 'text-red-400'
                      )} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Focus ring animation */}
              <motion.div
                animate={focusedField === 'password' ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 rounded-2xl border-2 border-indigo-400/50 pointer-events-none"
              />
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {errors.password && (
              <motion.p
                id="password-error"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="text-sm font-medium text-red-400 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                {errors.password.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── REMEMBER ME ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3 pt-2"
        >
          <div className="relative">
            <input
              id="remember"
              type="checkbox"
              {...register('remember')}
              className="w-5 h-5 rounded-lg border-2 border-indigo-400/40 bg-white/5 text-indigo-400 focus:ring-2 focus:ring-indigo-500/30 focus:ring-offset-0 backdrop-blur-sm cursor-pointer transition-all hover:border-indigo-300/60"
            />
          </div>
          <label htmlFor="remember" className="text-sm font-medium text-indigo-200/80 cursor-pointer hover:text-indigo-100 transition-colors">
            Remember me for 30 days
          </label>
        </motion.div>

        {/* ── PREMIUM SUBMIT BUTTON ── */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{
            scale: 1.02,
            y: -2,
            transition: { duration: 0.2, ease: 'easeOut' }
          }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={cn(
            'w-full relative group overflow-hidden',
            'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700',
            'hover:from-indigo-500 hover:via-blue-500 hover:to-indigo-600',
            'rounded-2xl py-4 px-6 text-white font-bold text-base',
            'shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-400/40',
            'transition-all duration-300',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-0',
            'border border-indigo-400/30'
          )}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/0 via-blue-400/0 to-purple-400/0 group-hover:from-indigo-400/20 group-hover:via-blue-400/20 group-hover:to-purple-400/20 transition-all duration-500" />

          {/* Shine effect */}
          <div className="absolute inset-0 -left-full group-hover:left-full bg-white/20 w-full h-full transition-all duration-700 ease-out" />

          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />

          <div className="relative z-10 flex items-center justify-center gap-3">
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-3"
                >
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing in…</span>
                </motion.div>
              ) : (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-3"
                >
                  <span>Sign in to PlaceReady</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>

        {/* ── SIGN UP LINK ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-sm text-indigo-300/70 pt-2"
        >
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-bold text-indigo-300 hover:text-white transition-colors duration-200 hover:underline underline-offset-2"
          >
            Create one now
          </Link>
        </motion.p>
      </form>
    </div>
  )
}