import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ToastProvider, useToast } from '@/contexts/ToastContext'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { act } from '@testing-library/react'

// Mock framer-motion to avoid animation delays in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) =>
      React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}))

function TestApp({ action }: { action: 'success' | 'error' }) {
  const toast = useToast()
  return (
    <button onClick={() => toast[action]('Test message')}>
      Show toast
    </button>
  )
}

function renderWithProvider(action: 'success' | 'error' = 'success') {
  return render(
    React.createElement(
      ToastProvider,
      null,
      React.createElement(TestApp, { action }),
      React.createElement(ToastContainer)
    )
  )
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a success toast when triggered', () => {
    renderWithProvider('success')
    fireEvent.click(screen.getByText('Show toast'))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('manual dismiss removes toast from DOM', () => {
    renderWithProvider('success')
    fireEvent.click(screen.getByText('Show toast'))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    const closeBtn = screen.getByLabelText('Dismiss notification')
    fireEvent.click(closeBtn)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('auto-dismisses after 4000ms', () => {
    renderWithProvider('success')
    fireEvent.click(screen.getByText('Show toast'))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
