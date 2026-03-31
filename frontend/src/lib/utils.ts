import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatScore(value: number, max = 10): string {
  return `${value.toFixed(1)}/${max}`
}

export function getRiskColor(risk: 'Low' | 'Medium' | 'High'): string {
  const map: Record<'Low' | 'Medium' | 'High', string> = {
    Low: 'text-green-500',
    Medium: 'text-yellow-500',
    High: 'text-red-500',
  }
  return map[risk]
}

export function getRiskBgColor(risk: 'Low' | 'Medium' | 'High'): string {
  const map: Record<'Low' | 'Medium' | 'High', string> = {
    Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Medium:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    High: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }
  return map[risk]
}
