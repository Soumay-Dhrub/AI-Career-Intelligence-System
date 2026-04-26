import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { setTokenGetter } from '@/services/api'
import type { User, Session } from '@supabase/supabase-js'

// Lazy import to avoid circular deps
async function fireLoginNotification(name: string) {
  try {
    const { pushNotification } = await import('@/stores/notificationStore')
    await pushNotification(
      'Login successful 🎉',
      `Welcome back to PlaceReady, ${name}!`,
      'login'
    )
  } catch { /* non-critical */ }
}

interface AuthUser {
  name: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  // Actions
  login: (credentials: { email: string; password: string }, remember: boolean) => Promise<void>
  signup: (data: { name: string; email: string; password: string }) => Promise<void>
  googleLogin: (credential?: string) => Promise<void>
  logout: () => Promise<void>
  _setSession: (session: Session | null) => void
}

function sessionToUser(session: Session | null): { user: AuthUser | null; token: string | null } {
  if (!session) return { user: null, token: null }
  const sbUser: User = session.user
  return {
    token: session.access_token,
    user: {
      email: sbUser.email ?? '',
      name:
        (sbUser.user_metadata?.full_name as string | undefined) ??
        (sbUser.user_metadata?.name as string | undefined) ??
        sbUser.email?.split('@')[0] ??
        'User',
    },
  }
}

export const useAuthStore = create<AuthState>()((set) => {
  return {
    user: null,
    token: null,
    isAuthenticated: false,

    _setSession: (session) => {
      const { user, token } = sessionToUser(session)
      set({ user, token, isAuthenticated: !!token })
    },

    login: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw { message: error.message }
      const { user, token } = sessionToUser(data.session)
      set({ user, token, isAuthenticated: true })
      // Fire login notification (non-blocking)
      if (user) fireLoginNotification(user.name)
    },

    signup: async ({ name, email, password }) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) throw { message: error.message }
      // Don't auto-login — user may need to confirm email
    },

    googleLogin: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) throw { message: error.message }
      // Redirect handled by Supabase — session set via onAuthStateChange
    },

    logout: async () => {
      await supabase.auth.signOut()
      set({ user: null, token: null, isAuthenticated: false })
    },
  }
})

// Bootstrap: restore session on page load + listen for auth changes
supabase.auth.getSession().then(({ data }) => {
  useAuthStore.getState()._setSession(data.session)
})

let _prevUserId: string | null = null
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.getState()._setSession(session)
  // Fire login notification on new sign-in (not on page reload)
  if (event === 'SIGNED_IN' && session) {
    const userId = session.user.id
    if (userId !== _prevUserId) {
      _prevUserId = userId
      const name =
        (session.user.user_metadata?.full_name as string | undefined) ??
        session.user.email?.split('@')[0] ??
        'there'
      fireLoginNotification(name)
    }
  }
  if (event === 'SIGNED_OUT') _prevUserId = null
})

// Wire token getter for Axios interceptor
setTokenGetter(() => useAuthStore.getState().token)
