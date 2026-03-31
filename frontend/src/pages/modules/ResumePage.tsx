import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2 } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import { SkillChip } from '@/components/ui/SkillChip'
import type { ResumeResponse } from '@/types/api'

const textareaCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 resize-none'

export function ResumePage() {
  const toast = useToast()
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<ResumeResponse | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!resumeText.trim() || !jobDescription.trim()) {
      toast.error('Both resume text and job description are required')
      return
    }
    setLoading(true)
    try {
      const res = await api.resumeAnalysis({ resume_text: resumeText, job_description: jobDescription })
      setResult(res.data)
      toast.success('Resume analyzed!')
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">📄</div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Resume Analyzer</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Score your resume against a job description using AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Resume Text</label>
          <textarea rows={10} value={resumeText} onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume content here..."
            className={textareaCls} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Job Description</label>
          <textarea rows={10} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the target job description here..."
            className={textareaCls} />
        </motion.div>
      </div>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold transition-all disabled:opacity-60 btn-glow mb-5">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
        {loading ? 'Analyzing…' : 'Analyze Resume'}
      </button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 text-center">
            <p className="section-label mb-2">Resume Score</p>
            <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{(result.resume_score * 100).toFixed(1)}%</p>
            <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${result.resume_score * 100}%` }}
                transition={{ duration: 0.8 }} className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 text-center">
            <p className="section-label mb-2">Keyword Match</p>
            <p className="text-4xl font-black text-sky-500">{result.keyword_match.toFixed(1)}%</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
            <p className="section-label mb-2">Missing Skills</p>
            {result.missing_skills.length === 0 ? (
              <p className="text-sm text-emerald-500 font-medium">✅ No missing skills!</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {result.missing_skills.map((s) => <SkillChip key={s} skill={s} variant="missing" />)}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
