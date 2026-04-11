import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { useToast } from '@/contexts/ToastContext'
import { Toast } from './Toast'

export function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}
