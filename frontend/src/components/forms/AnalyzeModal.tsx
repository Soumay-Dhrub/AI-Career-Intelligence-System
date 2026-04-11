import React, { useState } from 'react'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'
import type { AnalyzeRequest } from '@/types/api'

// ---- Zod schemas per step ----
const step1Schema = z.object({
  numDays: z.number().int().min(7).max(30),
  dailyHours: z.array(z.number().min(0).max(24)),
})

const step2Schema = z.object({
  resumeText: z.string().min(10, 'Resume text is required'),
  jobDescription: z.string().min(10, 'Job description is required'),
})

const step3Schema = z.object({
  durationMonths: z.number().int().min(0).max(24),
  companyTier: z.number().int().min(1).max(3),
  roleRelevance: z.number().min(0).max(1),
  projectCount: z.number().int().min(0),
})

const step4Schema = z.object({
  subjectScores: z.array(
    z.object({
      subject: z.string().min(1, 'Subject name required'),
      score: z.number().min(0).max(100),
    })
  ).min(1, 'Add at least one subject'),
  backlogs: z.number().int().min(0),
  projectFailures: z.number().int().min(0),
})

const step5Schema = z.object({
  currentSkills: z.string().min(1, 'Enter at least one current skill'),
  targetSkills: z.string().min(1, 'Enter at least one target skill'),
  targetRole: z.string().min(2, 'Target role is required'),
})

interface FormData {
  step1: z.infer<typeof step1Schema>
  step2: z.infer<typeof step2Schema>
  step3: z.infer<typeof step3Schema>
  step4: z.infer<typeof step4Schema>
  step5: z.infer<typeof step5Schema>
}

interface AnalyzeModalProps {
  open: boolean
  onClose: () => void
}

const STEPS = ['Study Logs', 'Resume', 'Internship', 'Performance', 'Skill Gap']

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200'

// ---- Step 1 ----
function Step1({ data, onChange }: { data: FormData['step1']; onChange: (d: FormData['step1']) => void }) {
  const [numDays, setNumDays] = useState(data.numDays)
  const [hours, setHours] = useState<number[]>(
    data.dailyHours.length === numDays ? data.dailyHours : Array(numDays).fill(6)
  )

  function handleDaysChange(n: number) {
    const newHours = Array(n).fill(0).map((_, i) => hours[i] ?? 6)
    setNumDays(n)
    setHours(newHours)
    onChange({ numDays: n, dailyHours: newHours })
  }

  function handleHourChange(i: number, v: number) {
    const updated = [...hours]
    updated[i] = v
    setHours(updated)
    onChange({ numDays, dailyHours: updated })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Number of days ({numDays})
        </label>
        <input type="range" min={7} max={30} value={numDays}
          onChange={(e) => handleDaysChange(Number(e.target.value))}
          className="w-full accent-blue-600" />
        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>7</span><span>30</span></div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Daily study hours
        </label>
        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
          {hours.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400">D{i + 1}</span>
              <input type="number" min={0} max={24} value={h}
                onChange={(e) => handleHourChange(i, Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---- Step 2 ----
function Step2({ data, onChange }: { data: FormData['step2']; onChange: (d: FormData['step2']) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Resume Text</label>
        <textarea rows={5} value={data.resumeText}
          onChange={(e) => onChange({ ...data, resumeText: e.target.value })}
          placeholder="Paste your resume content here..."
          className={cn(inputCls, 'resize-none')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Job Description</label>
        <textarea rows={5} value={data.jobDescription}
          onChange={(e) => onChange({ ...data, jobDescription: e.target.value })}
          placeholder="Paste the target job description here..."
          className={cn(inputCls, 'resize-none')} />
      </div>
    </div>
  )
}

// ---- Step 3 ----
function Step3({ data, onChange }: { data: FormData['step3']; onChange: (d: FormData['step3']) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Duration (months)</label>
          <input type="number" min={0} max={24} value={data.durationMonths}
            onChange={(e) => onChange({ ...data, durationMonths: Number(e.target.value) })}
            className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Count</label>
          <input type="number" min={0} value={data.projectCount}
            onChange={(e) => onChange({ ...data, projectCount: Number(e.target.value) })}
            className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Company Tier</label>
        <div className="flex gap-3">
          {[1, 2, 3].map((tier) => (
            <label key={tier} className={cn(
              'flex-1 flex items-center justify-center py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium',
              data.companyTier === tier
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
            )}>
              <input type="radio" name="companyTier" value={tier} checked={data.companyTier === tier}
                onChange={() => onChange({ ...data, companyTier: tier })} className="hidden" />
              Tier {tier}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Role Relevance ({data.roleRelevance.toFixed(2)})
        </label>
        <input type="range" min={0} max={1} step={0.01} value={data.roleRelevance}
          onChange={(e) => onChange({ ...data, roleRelevance: Number(e.target.value) })}
          className="w-full accent-blue-600" />
        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0</span><span>1</span></div>
      </div>
    </div>
  )
}

// ---- Step 4 ----
function Step4({ data, onChange }: { data: FormData['step4']; onChange: (d: FormData['step4']) => void }) {
  function addSubject() {
    onChange({ ...data, subjectScores: [...data.subjectScores, { subject: '', score: 75 }] })
  }
  function removeSubject(i: number) {
    onChange({ ...data, subjectScores: data.subjectScores.filter((_, idx) => idx !== i) })
  }
  function updateSubject(i: number, field: 'subject' | 'score', value: string | number) {
    const updated = [...data.subjectScores]
    updated[i] = { ...updated[i], [field]: value }
    onChange({ ...data, subjectScores: updated })
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject Scores</label>
          <button type="button" onClick={addSubject}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
            <Plus size={13} /> Add Subject
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {data.subjectScores.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" placeholder="Subject" value={s.subject}
                onChange={(e) => updateSubject(i, 'subject', e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
              <input type="number" min={0} max={100} value={s.score}
                onChange={(e) => updateSubject(i, 'score', Number(e.target.value))}
                className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
              <button type="button" onClick={() => removeSubject(i)}
                className="text-red-400 hover:text-red-600 p-1 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Backlogs</label>
          <input type="number" min={0} value={data.backlogs}
            onChange={(e) => onChange({ ...data, backlogs: Number(e.target.value) })}
            className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Failures</label>
          <input type="number" min={0} value={data.projectFailures}
            onChange={(e) => onChange({ ...data, projectFailures: Number(e.target.value) })}
            className={inputCls} />
        </div>
      </div>
    </div>
  )
}

// ---- Step 5 ----
function Step5({ data, onChange }: { data: FormData['step5']; onChange: (d: FormData['step5']) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Current Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
        </label>
        <input type="text" value={data.currentSkills}
          onChange={(e) => onChange({ ...data, currentSkills: e.target.value })}
          placeholder="Python, React, SQL..."
          className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Target Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
        </label>
        <input type="text" value={data.targetSkills}
          onChange={(e) => onChange({ ...data, targetSkills: e.target.value })}
          placeholder="TypeScript, Docker, Kubernetes..."
          className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Role</label>
        <input type="text" value={data.targetRole}
          onChange={(e) => onChange({ ...data, targetRole: e.target.value })}
          placeholder="Software Engineer, Data Scientist..."
          className={inputCls} />
      </div>
    </div>
  )
}

// ---- Main Modal ----
export function AnalyzeModal({ open, onClose }: AnalyzeModalProps) {
  const runAnalysis = useAnalysisStore((s) => s.runAnalysis)
  const isLoading = useAnalysisStore((s) => s.isLoading)
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<string[]>([])

  const [formData, setFormData] = useState<FormData>({
    step1: { numDays: 14, dailyHours: Array(14).fill(6) },
    step2: { resumeText: '', jobDescription: '' },
    step3: { durationMonths: 6, companyTier: 2, roleRelevance: 0.7, projectCount: 2 },
    step4: { subjectScores: [{ subject: 'Mathematics', score: 75 }], backlogs: 0, projectFailures: 0 },
    step5: { currentSkills: '', targetSkills: '', targetRole: '' },
  })

  function validateStep(): boolean {
    const schemas = [step1Schema, step2Schema, step3Schema, step4Schema, step5Schema]
    const stepKeys: (keyof FormData)[] = ['step1', 'step2', 'step3', 'step4', 'step5']
    const result = schemas[step].safeParse(formData[stepKeys[step]])
    if (!result.success) {
      setErrors(result.error.errors.map((e) => e.message))
      return false
    }
    setErrors([])
    return true
  }

  function handleNext() {
    if (validateStep()) setStep((s) => s + 1)
  }

  function handleBack() {
    setErrors([])
    setStep((s) => s - 1)
  }

  async function handleSubmit() {
    if (!validateStep()) return

    const today = new Date()
    const dates = Array.from({ length: formData.step1.numDays }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (formData.step1.numDays - 1 - i))
      return d.toISOString().split('T')[0]
    })

    const payload: AnalyzeRequest = {
      study_log: { daily_hours: formData.step1.dailyHours, dates },
      resume_text: formData.step2.resumeText,
      job_description: formData.step2.jobDescription,
      internship: {
        duration_months: formData.step3.durationMonths,
        company_tier: formData.step3.companyTier,
        role_relevance: formData.step3.roleRelevance,
        project_count: formData.step3.projectCount,
      },
      performance: {
        subject_scores: formData.step4.subjectScores,
        backlogs: formData.step4.backlogs,
        project_failures: formData.step4.projectFailures,
      },
      skill_gap: {
        current_skills: formData.step5.currentSkills.split(',').map((s) => s.trim()).filter(Boolean),
        target_skills: formData.step5.targetSkills.split(',').map((s) => s.trim()).filter(Boolean),
        target_role: formData.step5.targetRole,
      },
    }

    try {
      await runAnalysis(payload)
      toast.success('Analysis complete!')
      onClose()
      setStep(0)
    } catch {
      toast.error('Analysis failed. Please try again.')
    }
  }

  if (!open) return null

  const progressPct = ((step + 1) / STEPS.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 size={36} className="animate-spin text-blue-600" />
            <div className="text-center">
              <p className="text-slate-900 dark:text-white font-semibold">Analyzing your data…</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">This may take a moment</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative z-20 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden"
      >
        {/* Thin blue progress bar at very top */}
        <div className="h-0.5 bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 to-sky-500"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Run Analysis</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {STEPS.map((_s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                i < step ? 'bg-blue-600 text-white' :
                i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40' :
                'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-px w-6 transition-colors', i < step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700')} />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-[280px]">
          {errors.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-400">{e}</p>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && <Step1 data={formData.step1} onChange={(d) => setFormData((f) => ({ ...f, step1: d }))} />}
              {step === 1 && <Step2 data={formData.step2} onChange={(d) => setFormData((f) => ({ ...f, step2: d }))} />}
              {step === 2 && <Step3 data={formData.step3} onChange={(d) => setFormData((f) => ({ ...f, step3: d }))} />}
              {step === 3 && <Step4 data={formData.step4} onChange={(d) => setFormData((f) => ({ ...f, step4: d }))} />}
              {step === 4 && <Step5 data={formData.step5} onChange={(d) => setFormData((f) => ({ ...f, step5: d }))} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0 || isLoading}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white btn-glow transition-all disabled:opacity-60 disabled:shadow-none"
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              {isLoading ? 'Analyzing…' : 'Run Analysis'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
