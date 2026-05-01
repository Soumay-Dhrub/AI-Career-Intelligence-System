/**
 * AnalyzeModal — redesigned with slider-based inputs matching the new module design.
 * Collects all data needed for the full pipeline in 5 clean steps.
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, ChevronRight, ChevronLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'
import type { AnalyzeRequest } from '@/types/api'

interface AnalyzeModalProps { open: boolean; onClose: () => void }

const STEPS = [
  { label: 'Study Logs', icon: '📊', desc: 'How many hours do you study daily?' },
  { label: 'Resume', icon: '📄', desc: 'Paste your resume and target job description' },
  { label: 'Internship', icon: '💼', desc: 'Tell us about your internship experience' },
  { label: 'Performance', icon: '🎓', desc: 'Your academic scores and backlogs' },
  { label: 'Skills', icon: '⚡', desc: 'Current skills and what you want to learn' },
]

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all'

// ── Step 1: Study Logs ────────────────────────────────────────────────────────
function Step1({ hours, setHours, numDays, setNumDays }: {
  hours: number[]; setHours: (h: number[]) => void
  numDays: number; setNumDays: (n: number) => void
}) {
  function handleDaysChange(n: number) {
    setNumDays(n)
    setHours(Array(n).fill(0).map((_, i) => hours[i] ?? 5))
  }
  const avg = hours.length ? (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(1) : '0'
  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-medium text-slate-700 dark:text-slate-300">Days to track</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{numDays} days</span>
        </div>
        <input type="range" min={7} max={30} value={numDays}
          onChange={e => handleDaysChange(Number(e.target.value))} className="w-full accent-blue-600" />
        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>7</span><span>30</span></div>
      </div>
      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400">
        📈 Average: <span className="font-bold">{avg}h/day</span> across {numDays} days
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Daily study hours</p>
        <div className="grid grid-cols-7 gap-1.5 max-h-40 overflow-y-auto pr-1">
          {hours.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400">D{i+1}</span>
              <input type="number" min={0} max={24} value={h}
                onChange={e => { const u = [...hours]; u[i] = Number(e.target.value); setHours(u) }}
                className="w-full px-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Resume ────────────────────────────────────────────────────────────
function Step2({ resumeText, setResumeText, jobDesc, setJobDesc }: {
  resumeText: string; setResumeText: (v: string) => void
  jobDesc: string; setJobDesc: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Resume Text</label>
        <textarea rows={5} value={resumeText} onChange={e => setResumeText(e.target.value)}
          placeholder="Paste your resume content here... (skills, experience, projects)"
          className={cn(inputCls, 'resize-none')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Job Description</label>
        <textarea rows={5} value={jobDesc} onChange={e => setJobDesc(e.target.value)}
          placeholder="Paste the job description you're targeting..."
          className={cn(inputCls, 'resize-none')} />
      </div>
    </div>
  )
}

// ── Step 3: Internship ────────────────────────────────────────────────────────
function Step3({ duration, setDuration, tier, setTier, relevance, setRelevance, projects, setProjects }: {
  duration: number; setDuration: (v: number) => void
  tier: number; setTier: (v: number) => void
  relevance: number; setRelevance: (v: number) => void
  projects: number; setProjects: (v: number) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-medium text-slate-700 dark:text-slate-300">Internship Duration</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{duration} months</span>
        </div>
        <input type="range" min={0} max={24} step={1} value={duration}
          onChange={e => setDuration(Number(e.target.value))} className="w-full accent-blue-600" />
        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0 (none)</span><span>24 months</span></div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Company Tier</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { t: 1, label: 'Tier 1', desc: 'FAANG / Top MNC' },
            { t: 2, label: 'Tier 2', desc: 'Mid-level company' },
            { t: 3, label: 'Tier 3', desc: 'Startup / Other' },
          ].map(({ t, label, desc }) => (
            <button key={t} onClick={() => setTier(t)}
              className={cn('py-2.5 px-2 rounded-xl border text-center transition-all',
                tier === t ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400')}>
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-xs opacity-70">{desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-medium text-slate-700 dark:text-slate-300">Role Relevance</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{(relevance * 100).toFixed(0)}%</span>
        </div>
        <input type="range" min={0} max={1} step={0.05} value={relevance}
          onChange={e => setRelevance(Number(e.target.value))} className="w-full accent-blue-600" />
      </div>
      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span className="font-medium text-slate-700 dark:text-slate-300">Projects Built</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">{projects}</span>
        </div>
        <input type="range" min={0} max={10} step={1} value={projects}
          onChange={e => setProjects(Number(e.target.value))} className="w-full accent-blue-600" />
      </div>
    </div>
  )
}

// ── Step 4: Performance ───────────────────────────────────────────────────────
function Step4({ subjects, setSubjects, backlogs, setBacklogs, projFail, setProjFail }: {
  subjects: { subject: string; score: number }[]
  setSubjects: (v: { subject: string; score: number }[]) => void
  backlogs: number; setBacklogs: (v: number) => void
  projFail: number; setProjFail: (v: number) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Subject Scores</p>
          <button onClick={() => setSubjects([...subjects, { subject: '', score: 75 }])}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {subjects.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="text" placeholder="Subject name" value={s.subject}
                onChange={e => { const u = [...subjects]; u[i] = { ...u[i], subject: e.target.value }; setSubjects(u) }}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
              <input type="number" min={0} max={100} value={s.score}
                onChange={e => { const u = [...subjects]; u[i] = { ...u[i], score: Number(e.target.value) }; setSubjects(u) }}
                className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
              <button onClick={() => setSubjects(subjects.filter((_, idx) => idx !== i))}
                className="text-red-400 hover:text-red-600 p-1 transition-colors"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">Backlogs</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{backlogs}</span>
          </div>
          <input type="range" min={0} max={10} step={1} value={backlogs}
            onChange={e => setBacklogs(Number(e.target.value))} className="w-full accent-blue-600" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-slate-700 dark:text-slate-300">Project Failures</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{projFail}</span>
          </div>
          <input type="range" min={0} max={5} step={1} value={projFail}
            onChange={e => setProjFail(Number(e.target.value))} className="w-full accent-blue-600" />
        </div>
      </div>
    </div>
  )
}

// ── Step 5: Skills ────────────────────────────────────────────────────────────
function Step5({ currentSkills, setCurrentSkills, targetSkills, setTargetSkills, targetRole, setTargetRole }: {
  currentSkills: string; setCurrentSkills: (v: string) => void
  targetSkills: string; setTargetSkills: (v: string) => void
  targetRole: string; setTargetRole: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Current Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
        </label>
        <input type="text" value={currentSkills} onChange={e => setCurrentSkills(e.target.value)}
          placeholder="Python, React, SQL, Git..." className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Target Skills <span className="text-slate-400 font-normal">(what you want to learn)</span>
        </label>
        <input type="text" value={targetSkills} onChange={e => setTargetSkills(e.target.value)}
          placeholder="Docker, Kubernetes, System Design..." className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Role</label>
        <input type="text" value={targetRole} onChange={e => setTargetRole(e.target.value)}
          placeholder="Software Engineer, Data Scientist, ML Engineer..." className={inputCls} />
      </div>
      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
        ✅ All set! Click "Run Analysis" to get your personalized placement report.
      </div>
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function AnalyzeModal({ open, onClose }: AnalyzeModalProps) {
  const runAnalysis = useAnalysisStore(s => s.runAnalysis)
  const isLoading = useAnalysisStore(s => s.isLoading)
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')

  // Step 1
  const [numDays, setNumDays] = useState(14)
  const [hours, setHours] = useState<number[]>(Array(14).fill(5))
  // Step 2
  const [resumeText, setResumeText] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  // Step 3
  const [duration, setDuration] = useState(6)
  const [tier, setTier] = useState(2)
  const [relevance, setRelevance] = useState(0.7)
  const [projects, setProjects] = useState(2)
  // Step 4
  const [subjects, setSubjects] = useState([{ subject: 'Mathematics', score: 75 }, { subject: 'Computer Science', score: 80 }])
  const [backlogs, setBacklogs] = useState(0)
  const [projFail, setProjFail] = useState(0)
  // Step 5
  const [currentSkills, setCurrentSkills] = useState('')
  const [targetSkills, setTargetSkills] = useState('')
  const [targetRole, setTargetRole] = useState('')

  function validate(): string {
    if (step === 0 && hours.every(h => h === 0)) return 'Enter at least some study hours'
    if (step === 1 && !resumeText.trim()) return 'Resume text is required'
    if (step === 1 && !jobDesc.trim()) return 'Job description is required'
    if (step === 3 && subjects.length === 0) return 'Add at least one subject'
    if (step === 4 && !targetRole.trim()) return 'Target role is required'
    return ''
  }

  function handleNext() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  function handleBack() {
    setError('')
    setStep(s => s - 1)
  }

  async function handleSubmit() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')

    const today = new Date()
    const dates = Array.from({ length: numDays }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (numDays - 1 - i))
      return d.toISOString().split('T')[0]
    })

    const payload: AnalyzeRequest = {
      study_log: { daily_hours: hours, dates },
      resume_text: resumeText,
      job_description: jobDesc,
      internship: { duration_months: duration, company_tier: tier, role_relevance: relevance, project_count: projects },
      performance: { subject_scores: subjects, backlogs, project_failures: projFail },
      skill_gap: {
        current_skills: currentSkills.split(',').map(s => s.trim()).filter(Boolean),
        target_skills: targetSkills.split(',').map(s => s.trim()).filter(Boolean),
        target_role: targetRole,
      },
    }

    try {
      await runAnalysis(payload)
      toast.success('Analysis complete! Dashboard updated.')
      onClose()
      setStep(0)
    } catch {
      toast.error('Analysis failed. Please try again.')
    }
  }

  if (!open) return null

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 flex flex-col items-center gap-5 shadow-2xl max-w-sm w-full mx-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
              </div>
              <div className="text-center">
                <p className="text-slate-900 dark:text-white font-bold text-base">Running Full Analysis</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Processing all 6 AI modules…</p>
              </div>
              <div className="w-full space-y-2">
                {['Burnout & Consistency', 'Resume ATS', 'Internship Score', 'Failure Analysis', 'Roadmap', 'Placement Score'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }}
        className="relative z-20 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <motion.div className="h-full bg-gradient-to-r from-blue-600 to-sky-500 rounded-full"
            animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{STEPS[step].icon}</span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{STEPS[step].label}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{STEPS[step].desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{step + 1}/{STEPS.length}</span>
            <button onClick={onClose} disabled={isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 px-6 pt-4 pb-1">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-1">
              <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                i < step ? 'bg-blue-600 text-white' :
                i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40' :
                'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                {i < step ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={cn('flex-1 h-px', i < step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700')} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-[300px]">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
              {step === 0 && <Step1 hours={hours} setHours={setHours} numDays={numDays} setNumDays={setNumDays} />}
              {step === 1 && <Step2 resumeText={resumeText} setResumeText={setResumeText} jobDesc={jobDesc} setJobDesc={setJobDesc} />}
              {step === 2 && <Step3 duration={duration} setDuration={setDuration} tier={tier} setTier={setTier} relevance={relevance} setRelevance={setRelevance} projects={projects} setProjects={setProjects} />}
              {step === 3 && <Step4 subjects={subjects} setSubjects={setSubjects} backlogs={backlogs} setBacklogs={setBacklogs} projFail={projFail} setProjFail={setProjFail} />}
              {step === 4 && <Step5 currentSkills={currentSkills} setCurrentSkills={setCurrentSkills} targetSkills={targetSkills} setTargetSkills={setTargetSkills} targetRole={targetRole} setTargetRole={setTargetRole} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={handleBack} disabled={step === 0 || isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={16} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext} disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white btn-glow transition-all disabled:opacity-60 disabled:shadow-none">
              {isLoading ? <Loader2 size={15} className="animate-spin" /> : '🚀'}
              {isLoading ? 'Analyzing…' : 'Run Full Analysis'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
