import { create } from 'zustand'
import { authApi, setTokenGetter } from '@/services/api'
import type { LoginRequest } from '@/types/api'

interface AuthUser {
  name: string
  email: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginRequest, remember: boolean) => Promise<void>
  logout: () => void
}

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'

function safeGetItem(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeRemoveItem(storage: Storage, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // ignore
  }
}

function safeSetItem(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value)
  } catch {
    // ignore
  }
}

// Rehydrate from storage on init — wrapped in try/catch for SSR/test safety
function loadFromStorage(): { user: AuthUser | null; token: string | null } {
  try {
    const token =
      safeGetItem(localStorage, AUTH_TOKEN_KEY) ??
      safeGetItem(sessionStorage, AUTH_TOKEN_KEY)
    const userRaw =
      safeGetItem(localStorage, AUTH_USER_KEY) ??
      safeGetItem(sessionStorage, AUTH_USER_KEY)

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as AuthUser
        return { user, token }
      } catch {
        // corrupted storage — ignore
      }
    }
  } catch {
    // storage not available
  }
  return { user: null, token: null }
}

export const useAuthStore = create<AuthState>()((set) => {
  const { user: initialUser, token: initialToken } = loadFromStorage()

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: initialToken !== null,

    login: async (credentials: LoginRequest, remember: boolean) => {
      const res = await authApi.login(credentials)
      const { token, user } = res.data

      const storage = remember ? localStorage : sessionStorage
      safeSetItem(storage, AUTH_TOKEN_KEY, token)
      safeSetItem(storage, AUTH_USER_KEY, JSON.stringify(user))

      set({ user, token, isAuthenticated: true })
    },

    logout: () => {
      safeRemoveItem(localStorage, AUTH_TOKEN_KEY)
      safeRemoveItem(localStorage, AUTH_USER_KEY)
      safeRemoveItem(sessionStorage, AUTH_TOKEN_KEY)
      safeRemoveItem(sessionStorage, AUTH_USER_KEY)
      set({ user: null, token: null, isAuthenticated: false })
    },
  }
})

// Wire up the token getter in the API service
setTokenGetter(() => useAuthStore.getState().token)
