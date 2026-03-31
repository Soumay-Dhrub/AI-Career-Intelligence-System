import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'

// Provide a proper localStorage/sessionStorage mock for jsdom environments
// that don't initialize with a URL (which is required for real Storage API)
function createStorageMock(): Storage & { _reset: () => void } {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value) },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length },
    _reset: () => { store = {} },
  }
}

// Only stub if localStorage is not a proper Storage instance
if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createStorageMock(),
    writable: true,
    configurable: true,
  })
}

if (typeof sessionStorage === 'undefined' || typeof sessionStorage.getItem !== 'function') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createStorageMock(),
    writable: true,
    configurable: true,
  })
}

// Reset storage between tests to prevent state leakage
beforeEach(() => {
  if (typeof (localStorage as Storage & { _reset?: () => void })._reset === 'function') {
    (localStorage as Storage & { _reset: () => void })._reset()
  }
  if (typeof (sessionStorage as Storage & { _reset?: () => void })._reset === 'function') {
    (sessionStorage as Storage & { _reset: () => void })._reset()
  }
})
