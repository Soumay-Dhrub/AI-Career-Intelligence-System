// @vitest-environment jsdom
// Feature: placement-readiness-dashboard
// Property 15: Toast variant matches API outcome and auto-dismisses after 4000 ms
// Property 16: Multiple toasts stack simultaneously without replacing each other

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import fc from 'fast-check'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { ToastProvider, useToast } from '@/contexts/ToastContext'

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(ToastProvider, null, children)
}

describe('Toast property tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Property 15: Toast variant matches API outcome and auto-dismisses after 4000 ms
  it('Property 15: toast variant matches outcome and auto-dismisses after 4000ms', () => {
    // Validates: Requirements 12.1, 12.2, 12.3
    fc.assert(
      fc.property(
        fc.constantFrom('success' as const, 'error' as const),
        fc.string({ minLength: 1 }),
        (variant, message) => {
          const { result } = renderHook(() => useToast(), { wrapper })

          act(() => {
            if (variant === 'success') {
              result.current.success(message)
            } else {
              result.current.error(message)
            }
          })

          // Toast should be present with correct variant
          expect(result.current.toasts).toHaveLength(1)
          expect(result.current.toasts[0].variant).toBe(variant)
          expect(result.current.toasts[0].message).toBe(message)

          // After 4000ms it should auto-dismiss
          act(() => {
            vi.advanceTimersByTime(4000)
          })
          expect(result.current.toasts).toHaveLength(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Property 16: Multiple toasts stack simultaneously without replacing each other
  it('Property 16: n toasts fired before dismiss renders exactly n toasts', () => {
    // Validates: Requirements 12.4
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            variant: fc.constantFrom('success' as const, 'error' as const),
            message: fc.string({ minLength: 1 }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (toastDefs) => {
          const { result } = renderHook(() => useToast(), { wrapper })

          // Fire all toasts before any auto-dismiss
          act(() => {
            for (const def of toastDefs) {
              if (def.variant === 'success') {
                result.current.success(def.message)
              } else {
                result.current.error(def.message)
              }
            }
          })

          // All toasts should be present simultaneously
          expect(result.current.toasts).toHaveLength(toastDefs.length)

          // Dismiss all to clean up
          act(() => {
            vi.advanceTimersByTime(4000)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})
