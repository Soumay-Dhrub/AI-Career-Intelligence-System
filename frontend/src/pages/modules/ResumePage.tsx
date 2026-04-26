import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Upload, Loader2, CheckCircle, XCircle, Lightbulb, Target, Layout } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import { useNotify } from '@/hooks/useNotify'
import { cn } from '@/lib/utils'
import type { ResumeResponse, ImprovementSuggestion } from '@/types/api'

// ── ATS Score Meter ───────────────────────────────────────────────────────────
function ATSMeter({ score }: { score: number }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate Match' : 'Needs Work'
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor"
            className="text-slate-100 dark:text-slate-800" strokeWidth="10" />
          <motion.circle cx="60" cy="60" r="54" fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-900 dark:text-white">{score.toFixed(0)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

// ── Skill Tag ─────────────────────────────────────────────────────────────────
function SkillTag({ skill, variant }: { skill: string; variant: 'matched' | 'missing' | 'weak' }) {
  const styles = {
    matched: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    missing: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    weak:    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  }
  const icons = { matched: '✓', missing: '✗', weak: '~' }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border', styles[variant])}>
      <span className="opacity-70">{icons[variant]}</span> {skill}
    </span>
  )
}

// ── Suggestion Card ───────────────────────────────────────────────────────────
function SuggestionCard({ s, index }: { s: ImprovementSuggestion; index: number }) {
  const catConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    action_verbs: { icon: <Target size={13} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
    keywords:     { icon: <FileText size={13} />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' },
    impact:       { icon: <CheckCircle size={13} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
    structure:    { icon: <Layout size={13} />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' },
  }
  const cfg = catConfig[s.category] ?? catConfig.structure

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
      <div className="flex items-start gap-3">
        <span className={cn('p-1.5 rounded-lg shrink-0', cfg.color)}>{cfg.icon}</span>
        <div className="min-w-0">
          {s.original && (
            <p className="text-xs text-slate-400 dark:text-slate-500 line-through mb-1 truncate">{s.original}</p>
          )}
          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-snug">{s.suggestion}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.reason}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
        dragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
          : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      )}
    >
      <input ref={inputRef} type="file" accept=".pdf,.docx" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      <Upload size={24} className="mx-auto mb-2 text-slate-400" />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop your resume here</p>
      <p className="text-xs text-slate-400 mt-1">PDF or DOCX · Max 5 MB</p>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ResumePage() {
  const toast = useToast()
  const notify = useNotify()
  const [mode, setMode] = useState<'text' | 'upload'>('text')
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [result, setResult] = useState<ResumeResponse | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleAnalyze() {
    if (!jobDescription.trim()) { toast.error('Job description is required'); return }
    if (mode === 'text' && !resumeText.trim()) { toast.error('Resume text is required'); return }
    if (mode === 'upload' && !uploadedFile) { toast.error('Please upload a resume file'); return }

    setLoading(true)
    try {
      let res
      if (mode === 'upload' && uploadedFile) {
        const form = new FormData()
        form.append('file', uploadedFile)
        form.append('job_description', jobDescription)
        const { axiosInstance } = await import('@/services/api')
        res = await axiosInstance.post<ResumeResponse>('/resume/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        res = await api.resumeAnalysis({ resume_text: resumeText, job_description: jobDescription })
      }
      setResult(res.data)
      toast.success('Resume analyzed!')
      notify.moduleComplete('Resume Analyzer')
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const textareaCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none'

  return (
    <div className="p-5 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">📄</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">ATS Resume Analyzer</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Simulate a real ATS — get your score, skill gaps, and improvements</p>
        </div>
      </div>

      {/* Input section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Resume input */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Your Resume</h2>
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
              {(['text', 'upload'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={cn('px-3 py-1.5 font-medium transition-colors',
                    mode === m ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800')}>
                  {m === 'text' ? 'Paste Text' : 'Upload File'}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'text' ? (
              <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <textarea rows={10} value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume content here..."
                  className={textareaCls} />
              </motion.div>
            ) : (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <UploadZone onFile={setUploadedFile} />
                {uploadedFile && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-400">
                    <FileText size={14} />
                    <span className="truncate">{uploadedFile.name}</span>
                    <button onClick={() => setUploadedFile(null)} className="ml-auto shrink-0">
                      <XCircle size={14} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* JD input */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Job Description</h2>
          <textarea rows={10} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the target job description here... (e.g., Amazon SDE, Data Scientist)"
            className={textareaCls} />
        </div>
      </div>

      <button onClick={handleAnalyze} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-sm">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
        {loading ? 'Analyzing your resume…' : 'Analyze Resume'}
      </button>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Summary banner */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-5">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{result.summary}</p>
            </div>

            {/* Score row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* ATS Meter */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ATS Score</p>
                <ATSMeter score={result.ats_score} />
              </div>

            {/* Section breakdown */}
            {result.section_breakdown && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 sm:col-span-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Score Breakdown</p>
                <div className="space-y-3">
                  {[
                    { key: 'keyword_match', label: 'Keyword Match', weight: '30%', color: 'bg-blue-500' },
                    { key: 'semantic_similarity', label: 'Semantic Relevance', weight: '25%', color: 'bg-violet-500' },
                    { key: 'structure', label: 'Resume Structure', weight: '15%', color: 'bg-amber-500' },
                    { key: 'experience_quality', label: 'Experience Quality', weight: '20%', color: 'bg-emerald-500' },
                    { key: 'skill_gap_penalty', label: 'Skill Gap Penalty', weight: '−10%', color: 'bg-red-400' },
                  ].map(({ key, label, weight, color }) => {
                    const val = result.section_breakdown![key as keyof typeof result.section_breakdown] ?? 0
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 dark:text-slate-400">{label} <span className="text-slate-400">({weight})</span></span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{val.toFixed(0)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(val, 100)}%` }}
                            transition={{ duration: 0.7 }}
                            className={cn('h-full rounded-full', color)} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            </div>

            {/* Keyword + Skill match row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Keyword match */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Keyword Match</p>
                <p className="text-3xl font-black text-sky-600 dark:text-sky-400">{result.keyword_match.toFixed(0)}%</p>
                <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.keyword_match}%` }}
                    transition={{ duration: 0.8 }} className="h-full bg-sky-500 rounded-full" />
                </div>
              </div>

              {/* Skill match */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Skill Match</p>
                <p className="text-3xl font-black text-violet-600 dark:text-violet-400">{result.skill_match_pct.toFixed(0)}%</p>
                <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.skill_match_pct}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }} className="h-full bg-violet-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Template recommendation */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <Layout size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Recommended Template</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{result.template_recommendation}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{result.template_reason}</p>
              </div>
            </div>

            {/* Skills grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Matched skills */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-emerald-500" /> Matched Skills ({result.matched_skills.length})
                </p>
                {result.matched_skills.length === 0 ? (
                  <p className="text-sm text-slate-400">No skills matched yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.matched_skills.map((s) => <SkillTag key={s} skill={s} variant="matched" />)}
                  </div>
                )}
              </div>

              {/* Missing skills */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <XCircle size={13} className="text-red-500" /> Missing Skills ({result.missing_skills.length})
                </p>
                {result.missing_skills.length === 0 ? (
                  <p className="text-sm text-emerald-500 font-medium">✅ All required skills present!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {result.missing_skills.map((s) => <SkillTag key={s} skill={s} variant="missing" />)}
                  </div>
                )}
              </div>
            </div>

            {/* Weak keywords */}
            {result.weak_keywords.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Weak Keywords (in JD but missing from resume)
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.weak_keywords.map((k) => <SkillTag key={k} skill={k} variant="weak" />)}
                </div>
              </div>
            )}

            {/* Improvement suggestions */}
            {result.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lightbulb size={13} className="text-amber-500" /> Improvement Suggestions
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.suggestions.map((s, i) => <SuggestionCard key={i} s={s} index={i} />)}
                </div>
              </div>
            )}

            {/* Role-specific tips */}
            {result.role_specific_tips.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Target size={13} className="text-blue-500" /> Role-Specific Tips
                </p>
                <ul className="space-y-2">
                  {result.role_specific_tips.map((tip, i) => (
                    <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="text-blue-500 mt-0.5 shrink-0">→</span> {tip}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
