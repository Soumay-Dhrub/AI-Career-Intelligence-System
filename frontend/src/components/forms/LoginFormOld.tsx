import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  })

  async function onSubmit(values: LoginFormValues) {
    try {
      await login({ email: values.email, password: values.password }, values.remember ?? false)
      navigate('/dashboard')
    } catch (err: unknown) {
      const message = (err as { message?: string }).message ?? 'Login failed. Please try again.'
      toast.error(message)
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
    <div className="space-y-5">
      {/* Google Sign-In Button */}
      <motion.button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold',
          'border-2 border-slate-700/80 bg-slate-900/80',
          'text-slate-100 hover:bg-slate-900 hover:border-sky-400/40',
          'shadow-sm shadow-slate-950/30',
          'transition-all duration-200',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'group relative overflow-hidden'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-sky-400/0 via-sky-400/0 to-sky-400/0 group-hover:from-sky-400/10 group-hover:via-sky-400/10 group-hover:to-sky-400/0 transition-all duration-300" />
        
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="relative z-10">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        <span className="relative z-10">Continue with Google</span>
      </motion.button>

      {/* Premium Divider */}
      <div className="relative flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 whitespace-nowrap">
          or continue with email
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email Field */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Email Address
          </label>
          <div className="relative group">
            <input
              type="email"
              autoComplete="email"
              {...register('email', {
                onBlur: () => setFocusedField(null),
              })}
              onFocus={() => setFocusedField('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={cn(
                'input-field relative z-10 transition-all duration-300',
                'border-slate-200 dark:border-slate-700',
                'focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500',
                'dark:focus:border-blue-400',
                errors.email && 'border-red-400 dark:border-red-500 focus:ring-red-500/30 focus:border-red-500',
                focusedField === 'email' && 'shadow-lg shadow-blue-500/10'
              )}
              placeholder="you@example.com"
            />
            {/* Animated border glow effect */}
            <div className={cn(
              'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none',
              'bg-gradient-to-r from-blue-500/20 via-transparent to-blue-500/20',
              focusedField === 'email' && 'opacity-100'
            )} />
          </div>
          {errors.email && (
            <motion.p
              id="email-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              {errors.email.message}
            </motion.p>
          )}
        </motion.div>

        {/* Password Field */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link to="#" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
              Forgot?
            </Link>
          </div>
          <div className="relative group">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password', {
                onBlur: () => setFocusedField(null),
              })}
              onFocus={() => setFocusedField('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={cn(
                'input-field relative z-10 pr-12 transition-all duration-300',
                'border-slate-200 dark:border-slate-700',
                'focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500',
                'dark:focus:border-blue-400',
                errors.password && 'border-red-400 dark:border-red-500 focus:ring-red-500/30 focus:border-red-500',
                focusedField === 'password' && 'shadow-lg shadow-blue-500/10'
              )}
              placeholder="••••••••"
            />
            {/* Animated border glow effect */}
            <div className={cn(
              'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none',
              'bg-gradient-to-r from-blue-500/20 via-transparent to-blue-500/20',
              focusedField === 'password' && 'opacity-100'
            )} />
            
            {/* Show/Hide Password Toggle */}
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 text-slate-400 hover:text-slate-100 dark:hover:text-slate-100 transition-colors p-1"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </motion.button>
          </div>
          {errors.password && (
            <motion.p
              id="password-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs font-medium text-red-500 flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              {errors.password.message}
            </motion.p>
          )}
        </motion.div>

        {/* Remember Me */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 pt-2"
        >
          <div className="relative">
            <input
              id="remember"
              type="checkbox"
              {...register('remember')}
              className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-0 dark:bg-slate-800 cursor-pointer transition-all"
            />
          </div>
          <label htmlFor="remember" className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Remember me for 30 days
          </label>
        </motion.div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold',
            'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white',
            'shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40',
            'btn-glow transition-all duration-300 relative overflow-hidden group',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:shadow-none'
          )}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 -left-full group-hover:left-full transition-all duration-700 bg-white/20 w-full h-full" />
          
          <div className="relative z-10 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign in to PlaceReady</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </div>
        </motion.button>

        {/* Sign up link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="!mt-5 text-center text-sm text-slate-600 dark:text-slate-400"
        >
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors hover:underline">
            Create one now
          </Link>
        </motion.p>
      </form>
    </div>
  )
}
