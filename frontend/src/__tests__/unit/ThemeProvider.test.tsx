// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext'

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(ThemeProvider, null, children)
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    // jsdom localStorage may not have .clear() — use removeItem instead
    localStorage.removeItem('theme')
    document.documentElement.classList.remove('dark', 'light')
  })

  it('applies the correct class to <html> on init', () => {
    localStorage.setItem('theme', 'dark')
    renderHook(() => useTheme(), { wrapper })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('applies light class when stored theme is light', () => {
    localStorage.setItem('theme', 'light')
    renderHook(() => useTheme(), { wrapper })
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('toggleTheme switches the class on <html>', () => {
    localStorage.setItem('theme', 'light')
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.toggleTheme())
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })
})
