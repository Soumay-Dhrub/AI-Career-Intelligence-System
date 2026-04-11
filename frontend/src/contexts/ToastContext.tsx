import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export type ToastVariant = 'success' | 'error'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toasts: ToastItem[]
  success: (message: string) => void
  error: (message: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let _counter = 0
function nextId(): string {
  return `toast-${++_counter}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = nextId()
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => dismiss(id), 4000)
    },
    [dismiss]
  )

  const success = useCallback(
    (message: string) => addToast(message, 'success'),
    [addToast]
  )

  const error = useCallback(
    (message: string) => addToast(message, 'error'),
    [addToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, success, error, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
