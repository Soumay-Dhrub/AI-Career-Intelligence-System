import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/contexts/ToastContext'
import { GoogleLoginButton } from '@/components/ui/GoogleLoginButton'
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
      await authApi.signup({ name: values.name, email: values.email, password: values.password })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err: unknown) {
      const message = (err as { message?: string }).message ?? 'Signup failed. Please try again.'
      toast.error(message)
    }
  }

  async function handleGoogleCredential(credential: string) {
    try {
      const res = await authApi.googleLogin(credential)
      const { token, user } = res.data
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
      useAuthStore.setState({ user, token, isAuthenticated: true })
      navigate('/dashboard')
    } catch (err: unknown) {
      const message = (err as { message?: string }).message ?? 'Google sign-in failed.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-4">
      {/* Google Sign-In */}
      <GoogleLoginButton onCredential={handleGoogleCredential} disabled={isSubmitting} />

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
