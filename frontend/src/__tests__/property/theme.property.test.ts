// @vitest-environment jsdom
// Feature: placement-readiness-dashboard
// Property 12: Theme toggle is its own inverse and persists to localStorage
// Property 13: ThemeProvider initializes from localStorage or OS preference

import { describe, it, expect, beforeEach, vi } from 'vitest'
import fc from 'fast-check'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'

const THEME_KEY = 'theme'

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(ThemeProvider, null, children)
}

describe('Theme property tests', () => {
  beforeEach(() => {
    // jsdom localStorage may not have .clear() — use removeItem instead
    localStorage.removeItem('theme')
    document.documentElement.classList.remove('dark', 'light')
  })

  // Property 12: Theme toggle is its own inverse and persists to localStorage
  it('Property 12: toggle is its own inverse and persists to localStorage', () => {
    // Validates: Requirements 10.2, 10.3
    fc.assert(
      fc.property(
        fc.constantFrom('dark' as const, 'light' as const),
        (initialTheme) => {
          localStorage.setItem(THEME_KEY, initialTheme)
          document.documentElement.classList.remove('dark', 'light')

          const { result } = renderHook(() => useTheme(), { wrapper })

          expect(result.current.theme).toBe(initialTheme)

          // Toggle once — should flip
          act(() => {
            result.current.toggleTheme()
          })
          const flipped = initialTheme === 'dark' ? 'light' : 'dark'
          expect(result.current.theme).toBe(flipped)
          expect(localStorage.getItem(THEME_KEY)).toBe(flipped)
          expect(document.documentElement.classList.contains(flipped)).toBe(true)
          expect(document.documentElement.classList.contains(initialTheme)).toBe(false)

          // Toggle again — should restore original
          act(() => {
            result.current.toggleTheme()
          })
          expect(result.current.theme).toBe(initialTheme)
          expect(localStorage.getItem(THEME_KEY)).toBe(initialTheme)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property 13: ThemeProvider initializes from localStorage or OS preference
  it('Property 13: initializes from localStorage when present', () => {
    // Validates: Requirements 10.4
    fc.assert(
      fc.property(
        fc.constantFrom('dark' as const, 'light' as const),
        (storedTheme) => {
          localStorage.setItem(THEME_KEY, storedTheme)
          document.documentElement.classList.remove('dark', 'light')

          const { result } = renderHook(() => useTheme(), { wrapper })

          // Should use stored value regardless of OS preference
          expect(result.current.theme).toBe(storedTheme)
          expect(document.documentElement.classList.contains(storedTheme)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 13: falls back to OS preference when no localStorage value', () => {
    // Validates: Requirements 10.4
    fc.assert(
      fc.property(
        fc.boolean(),
        (prefersDark) => {
          localStorage.removeItem(THEME_KEY)
          document.documentElement.classList.remove('dark', 'light')

          // Mock matchMedia
          vi.stubGlobal('matchMedia', (query: string) => ({
            matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          }))

          const expectedTheme = prefersDark ? 'dark' : 'light'
          const { result } = renderHook(() => useTheme(), { wrapper })

          expect(result.current.theme).toBe(expectedTheme)

          vi.unstubAllGlobals()
        }
      ),
      { numRuns: 100 }
    )
  })
})
