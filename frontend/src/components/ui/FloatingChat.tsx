/**
 * FloatingChat — NextHire AI as a floating action button + popup panel.
 * Replaces the full-page /ai-chat route. Mounts globally in AppLayout.
 */
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Loader2, User, Sparkles, RotateCcw,
  ChevronRight, X, Minus,
} from 'lucide-react'
import { axiosInstance } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  { label: 'Analyze my profile', icon: '🔍', text: "I'm a 3rd year BTech CS student with 7.5 CGPA. I know Python, React, SQL. I have 2 projects and no internship. Target: Amazon SDE. Analyze my profile." },
  { label: 'Resume tips', icon: '📄', text: 'How can I improve my resume ATS score for a software engineering role?' },
  { label: 'DSA roadmap', icon: '⚡', text: "I'm at easy level DSA with 30 problems solved. Give me an 8-week roadmap to reach medium level." },
  { label: 'Company readiness', icon: '🎯', text: 'What skills do I need to get into Infosys or TCS as a fresher?' },
]

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Hi! I'm **NextHire AI** 👋 Your career assistant.

I can help with:
• 📄 Resume & ATS optimization
• 💼 Internship & company matching
• 🔍 Failure analysis & weak areas
• 🗺️ Personalized roadmap
• 🎯 Placement readiness
• ⚡ DSA / Coding guidance

**Describe your situation** or pick a quick option!`,
  timestamp: new Date(),
}

function formatContent(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const formatted = parts.map((p, j) =>
      j % 2 === 1 ? <strong key={j}>{p}</strong> : p
    )
    if (line.startsWith('• ') || line.startsWith('- '))
      return <div key={i} className="flex items-start gap-1.5 my-0.5"><span className="text-blue-400 shrink-0 mt-0.5">•</span><span>{formatted}</span></div>
    if (/^[🔍📊❌🚀🎯🧭💼📄⚡🗺️✅⚠️🚨💡📈]/.test(line) && line.length > 2)
      return <div key={i} className="font-semibold mt-2.5 mb-0.5 text-slate-800 dark:text-slate-100">{formatted}</div>
    if (line === '') return <div key={i} className="h-1" />
    return <div key={i}>{formatted}</div>
  })
}

export function FloatingChat() {
  const user = useAuthStore(s => s.user)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setError('')
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim(), timestamp: new Date() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await axiosInstance.post('/ai-chat', {
        messages: next.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, content: m.content })),
        user_name: user?.name,
      }, { timeout: 300000 })
      const reply = res?.data?.reply ?? ''
      if (!reply) {
        throw new Error('No reply received from AI service')
      }
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, timestamp: new Date() }
      setMessages(prev => [...prev, aiMsg])
      if (!open) setUnread(u => u + 1)
    } catch (err: unknown) {
      console.error('FloatingChat sendMessage error:', err)
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string }
      const msg = axiosErr.response?.data?.detail ?? axiosErr.message ?? 'Failed to get response'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <>
      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden',
              'bg-white dark:bg-slate-900',
              'border border-slate-200/60 dark:border-slate-700/60',
              'shadow-2xl',
              // Desktop: bottom-right panel
              'bottom-24 right-5 rounded-2xl w-[380px] h-[560px]',
              // Mobile: full-width bottom sheet
              'max-sm:bottom-0 max-sm:right-0 max-sm:left-0 max-sm:w-full max-sm:h-[85vh] max-sm:rounded-t-2xl max-sm:rounded-b-none',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-gradient-to-r from-blue-600 to-violet-600">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">NextHire AI</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <p className="text-xs text-white/70">Career Assistant</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setMessages([WELCOME]); setError('') }}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors" title="New chat">
                  <RotateCcw size={14} />
                </button>
                <button onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50 dark:bg-slate-950">
              <AnimatePresence initial={false}>
                {messages.map(msg => (
                  <motion.div key={msg.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                    <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                      msg.role === 'assistant' ? 'bg-gradient-to-br from-blue-600 to-violet-600' : 'bg-slate-600')}>
                      {msg.role === 'assistant' ? <Sparkles size={12} className="text-white" /> : <User size={12} className="text-white" />}
                    </div>
                    <div className={cn('max-w-[82%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed',
                      msg.role === 'assistant'
                        ? 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 shadow-sm'
                        : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white')}>
                      {msg.role === 'assistant' ? formatContent(msg.content) : msg.content}
                      <p className={cn('text-xs mt-1.5 opacity-40', msg.role === 'user' ? 'text-right' : '')}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shrink-0">
                    <Sparkles size={12} className="text-white" />
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl px-3 py-2.5 shadow-sm">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="text-center">
                  <span className="text-xs text-red-500 dark:text-red-400">{error} — </span>
                  <button onClick={() => setError('')} className="text-xs text-red-500 underline">Dismiss</button>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length === 1 && (
              <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_PROMPTS.map(qp => (
                    <button key={qp.label} onClick={() => sendMessage(qp.text)}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-left hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group">
                      <span className="text-sm shrink-0">{qp.icon}</span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{qp.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about resume, DSA, placement…"
                  rows={1}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none max-h-24 overflow-y-auto"
                  style={{ minHeight: '40px' }}
                />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB ── */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all hover:shadow-xl hover:shadow-blue-500/40"
        aria-label="Open NextHire AI"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles size={22} />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Unread badge */}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </motion.button>
    </>
  )
}
