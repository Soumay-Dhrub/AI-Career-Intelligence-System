/**
 * GoogleLoginButton — renders a "Sign in with Google" button using
 * Google Identity Services (GSI). Calls the backend /auth/google endpoint
 * with the returned credential (ID token).
 *
 * Usage: add VITE_GOOGLE_CLIENT_ID to frontend/.env
 * If the env var is missing the button is hidden gracefully.
 */
import React, { useEffect, useRef } from 'react'

interface GoogleLoginButtonProps {
  onCredential: (credential: string) => void
  disabled?: boolean
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
          }) => void
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: string
              size?: string
              width?: number
              text?: string
              shape?: string
            }
          ) => void
          prompt: () => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export function GoogleLoginButton({ onCredential, disabled }: GoogleLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !containerRef.current) return

    function initGoogle() {
      if (!window.google || !containerRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID!,
        callback: (response) => {
          if (response.credential) onCredential(response.credential)
        },
      })
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: containerRef.current.offsetWidth || 400,
        text: 'signin_with',
        shape: 'rectangular',
      })
    }

    // If GSI script already loaded
    if (window.google) {
      initGoogle()
      return
    }

    // Inject GSI script once
    const existing = document.getElementById('google-gsi-script')
    if (!existing) {
      const script = document.createElement('script')
      script.id = 'google-gsi-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initGoogle
      document.head.appendChild(script)
    } else {
      existing.addEventListener('load', initGoogle)
    }
  }, [onCredential])

  // Hide if no client ID configured
  if (!GOOGLE_CLIENT_ID) return null

  return (
    <div
      ref={containerRef}
      className={disabled ? 'pointer-events-none opacity-50' : ''}
      style={{ width: '100%', minHeight: 44 }}
    />
  )
}
