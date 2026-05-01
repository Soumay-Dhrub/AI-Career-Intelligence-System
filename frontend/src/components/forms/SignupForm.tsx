import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const navigate = useNavigate()
  const signup = useAuthStore((s) => s.signup)
  const googleLogin = useAuthStore((s) => s.googleLogin)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  async function onSubmit(values: SignupFormValues) {
    try {
      await signup({ name: values.name, email: values.email, password: values.password })
      toast.success('Account created! Check your email to confirm, then sign in.')
      navigate('/login')
    } catch (err: unknown) {
      const message = (err as { message?: string }).message ?? 'Signup failed. Please try again.'
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
    <div className="space-y-4">
      {/* Google Sign-In */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
        className={cn(
          'w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium',
          'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
          'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700',
          'transition-colors duration-150',
          'disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
          or create account with email
        </span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            autoComplete="name"
            {...register('name')}
            className={cn(
              'input-field',
              errors.name && 'border-red-400 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
            )}
            placeholder="Jane Doe"
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            className={cn(
              'input-field',
              errors.email && 'border-red-400 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
            )}
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className={cn(
              'input-field',
              errors.password && 'border-red-400 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
            )}
            placeholder="••••••••"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Confirm Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={cn(
              'input-field',
              errors.confirmPassword && 'border-red-400 dark:border-red-600 focus:ring-red-500/30 focus:border-red-500'
            )}
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold',
            'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white',
            'btn-glow transition-all duration-250',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none'
          )}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}
