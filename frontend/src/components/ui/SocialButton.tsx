import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface SocialButtonProps {
  provider: 'google'
  label: string
  onClick?: () => void
  disabled?: boolean
}

const providerIcons: Record<string, ReactNode> = {
  google: (
    <svg width="20" height="20" viewBox="0 0 533.5 544.3" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M533.5 278.4c0-18.8-1.7-37-5.1-54.7H272v103.6h146.9c-6.4 34.6-25.4 63.9-54.1 83.6v69.4h87.4c51.1-47.1 80.3-116.5 80.3-201.9z" fill="#4285F4" />
      <path d="M272 544.3c73.2 0 134.8-24.2 179.7-65.9l-87.4-69.4c-24.3 16.3-55.4 25.9-92.3 25.9-70.9 0-131-47.9-152.4-112.3H31.8v70.5c44 87.1 134 151.2 240.2 151.2z" fill="#34A853" />
      <path d="M119.6 324.7c-10.3-30.8-10.3-64 0-94.8V159.4H31.8c-38.1 76.8-38.1 167.9 0 244.7l87.8-79.4z" fill="#FBBC05" />
      <path d="M272 107.7c39.9 0 75.6 13.8 103.7 40.9l77.8-77.8C407 24.8 344.9 0 272 0 165.8 0 75.8 64.1 31.8 151.2l87.8 70.5C141 155.6 201.1 107.7 272 107.7z" fill="#EA4335" />
    </svg>
  ),
}

export function SocialButton({ provider, label, onClick = () => {}, disabled = false }: SocialButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-700/80 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-slate-100 shadow-sm shadow-slate-950/20 transition-all duration-200 hover:border-blue-400/40 hover:bg-slate-900/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/80 text-slate-100 shadow-inner shadow-slate-950/30">
        {providerIcons[provider]}
      </span>
      <span className="relative z-10">{label}</span>
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-blue-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.button>
  )
}
