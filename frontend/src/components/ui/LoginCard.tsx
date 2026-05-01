import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

interface LoginCardProps {
  children: ReactNode
}

export function LoginCard({ children }: LoginCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="glass-dark-enhanced relative overflow-hidden rounded-[1.75rem] border border-slate-700/50 shadow-[0_32px_80px_rgba(15,23,42,0.28)]"
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-blue-500/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
      <div className="relative px-8 pt-10 pb-10">
        {children}
      </div>
    </motion.div>
  )
}
