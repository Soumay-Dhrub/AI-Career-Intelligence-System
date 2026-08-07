import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User, Sparkles, RotateCcw, ChevronRight } from 'lucide-react'
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
  { label: 'DSA roadmap', icon: '⚡', text: 'I\'m at easy level DSA with 30 problems solved. Give me a 8-week roadmap to reach medium level.' },
  { label: 'Company readiness', icon: '🎯', text: 'What skills do I need to get into Infosys or TCS as a fresher?' },
]

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Hi! I'm **NextHire AI** 👋 Your intelligent career assistant on PlaceReady.

I can help you with:
• 📄 Resume analysis & ATS optimization
• 💼 Internship prediction & company matching
• 🔍 Failure analysis & weak area diagnosis
• 🗺️ Personalized learning roadmap
• 🎯 Placement readiness prediction
• ⚡ DSA / Coding / Aptitude guidance

**Just describe your situation** or pick a quick option below and I'll analyze it for you!`,
  timestamp: new Date(),
}

function formatContent(text: string): React.ReactNode {
  // Convert markdown-like formatting to JSX
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bold
    const parts = line.split(/\*\*(.*?)\*\*/g)
    const formatted = parts.map((part, j) =>
      j % 2 === 1 ? <strong key={j} className="font-bold">{part}</strong> : part
    )
    // Bullet points
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return <div key={i} className="flex items-start gap-2 my-0.5"><span className="text-blue-400 mt-0.5 shrink-0">•</span><span>{formatted}</span></div>
    }
    // Emoji headers
    if (/^[🔍📊❌🚀🎯🧭💼📄⚡🗺️✅⚠️🚨💡📈]/.test(line) && line.length > 2) {
      return <div key={i} className="font-semibold mt-3 mb-1 text-slate-800 dark:text-slate-100">{formatted}</div>
    }
    if (line === '') return <div key={i} className="h-1" />
    return <div key={i}>{formatted}</div>
  })
}

export function AIChatPage() {
  const user = useAuthStore(s => s.user)
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setError('')

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim(), timestamp: new Date() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const requestBody = {
        messages: newMessages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, content: m.content })),
        user_name: user?.name,
      }
      console.debug('AIChatPage sendMessage request', { url: '/ai-chat', timeout: 300000, body: requestBody })
      const res = await axiosInstance.post('/ai-chat', requestBody, { timeout: 300000 })
      console.debug('AIChatPage sendMessage response', { status: res.status, data: res.data })
      const reply = res?.data?.reply ?? ''
      if (!reply) {
        console.error('AIChatPage sendMessage no reply', { response: res?.data })
        throw new Error('No reply received from AI service')
      }
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err: unknown) {
      console.error('AIChatPage sendMessage error:', err)
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } }; message?: string }
      const msg = axiosErr.response?.data?.detail ?? axiosErr.message ?? 'Failed to get response'
      setError(`${msg} (check console for debug info)`)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function clearChat() {
    setMessages([WELCOME_MESSAGE])
    setError('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-sm">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 dark:text-white">NextHire AI</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs text-slateald-500 dark:text-slate-400 text-slate-500">Career Intelligence Assistant</p>
            </div>
          </div>
        </div>
        <button onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <RotateCcw size={13} /> New Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-slate-50 dark:bg-slate-950">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              {/* Avatar */}
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-blue-600 to-violet-600'
                  : 'bg-gradient-to-br from-slate-600 to-slate-700')}>
                {msg.role === 'assistant'
                  ? <Sparkles size={14} className="text-white" />
                  : <User size={14} className="text-white" />}
              </div>
              {/* Bubble */}
              <div className={cn('max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'assistant'
                  ? 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 shadow-sm'
                  : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white')}>
                {msg.role === 'assistant' ? formatContent(msg.content) : msg.content}
                <p className={cn('text-xs mt-2 opacity-50',
                  msg.role === 'user' ? 'text-right text-white' : 'text-slate-400')}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
              {error} — <button onClick={() => setError('')} className="underline">Dismiss</button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — only show when only welcome message */}
      {messages.length === 1 && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-800/60">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 px-1">Quick start:</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PROMPTS.map(qp => (
              <button key={qp.label} onClick={() => sendMessage(qp.text)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-left hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group">
                <span className="text-base shrink-0">{qp.icon}</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">{qp.label}</span>
                <ChevronRight size={11} className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-blue-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about resume, DSA, internships, placement... (Enter to send)"
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none max-h-32 overflow-y-auto"
              style={{ minHeight: '48px' }}
            />
          </div>
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm btn-glow shrink-0">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
          NextHire AI only assists with placement, resume, internship, and career topics.
        </p>
      </div>
    </div>
  )
}
