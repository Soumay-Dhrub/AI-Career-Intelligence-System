import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface FeatureItemProps {
  icon: LucideIcon
  title: string
  small?: boolean
}

export function FeatureItem({ icon: Icon, title, small = false }: FeatureItemProps) {
  return (
    <motion.div
      whileHover={{ x: 6 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      className={`flex items-center gap-3 rounded-3xl border border-slate-700/40 bg-slate-950/70 px-4 ${small ? 'py-3' : 'py-4'} text-sm text-slate-200 shadow-sm hover:border-blue-500/30 hover:bg-slate-900/80`}
    >
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-600/15 to-cyan-500/10 text-blue-300 shadow-inner shadow-slate-950/20">
        <Icon size={18} />
      </div>
      <p className="font-medium leading-6">{title}</p>
    </motion.div>
  )
}
