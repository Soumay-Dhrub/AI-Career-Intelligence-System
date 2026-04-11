import axios from 'axios'
import type {
  AnalyzeRequest,
  PlacementReport,
  ResumeRequest,
  ResumeResponse,
  BurnoutRequest,
  BurnoutResponse,
  InternshipPayload,
  InternshipResponse,
  PerformanceData,
  FailureResponse,
  SkillGap,
  RoadmapResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  ApiError,
} from '@/types/api'

// Token getter — set by authStore after initialization to avoid circular imports
let _getToken: (() => string | null) | null = null

export function setTokenGetter(getter: () => string | null): void {
  _getToken = getter
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
})

// Request interceptor: attach Bearer token
axiosInstance.interceptors.request.use((config) => {
  const token = _getToken ? _getToken() : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalize non-2xx errors to ApiError shape
function normalizeError(err: unknown): ApiError {
  const axiosErr = err as {
    response?: { status?: number; data?: { detail?: string } }
    message?: string
  }
  return {
    status: axiosErr.response?.status ?? 0,
    message:
      axiosErr.response?.data?.detail ??
      axiosErr.message ??
      'Network error — please check your connection',
  }
}

// Response interceptor: normalize non-2xx to ApiError
axiosInstance.interceptors.response.use(
  (res) => res,
  (err: unknown) => Promise.reject(normalizeError(err))
)

export const api = {
  analyze: (payload: AnalyzeRequest) =>
    axiosInstance.post<PlacementReport>('/analyze', payload),

  resumeAnalysis: (payload: ResumeRequest) =>
    axiosInstance.post<ResumeResponse>('/resume', payload),

  burnoutAnalysis: (payload: BurnoutRequest) =>
    axiosInstance.post<BurnoutResponse>('/burnout', payload),

  internshipAnalysis: (payload: InternshipPayload) =>
    axiosInstance.post<InternshipResponse>('/internship', payload),

  failureAnalysis: (payload: PerformanceData) =>
    axiosInstance.post<FailureResponse>('/failure', payload),

  roadmapGeneration: (payload: SkillGap) =>
    axiosInstance.post<RoadmapResponse>('/roadmap', payload),

  healthCheck: () => axiosInstance.get('/health'),
}

// Auth endpoints — separate instance, no auth header needed
const authAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000,
})

authAxios.interceptors.response.use(
  (res) => res,
  (err: unknown) => Promise.reject(normalizeError(err))
)

export const authApi = {
  login: (credentials: LoginRequest) =>
    authAxios.post<LoginResponse>('/auth/login', credentials),

  signup: (data: SignupRequest) =>
    authAxios.post<{ message: string }>('/auth/signup', data),

  googleLogin: (credential: string) =>
    authAxios.post<LoginResponse>('/auth/google', { credential }),
}

export { axiosInstance }
