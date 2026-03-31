import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Save, Upload, FileText, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/contexts/ToastContext'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

const PROFILE_KEY = 'user_profile'

interface ProfileData {
  name: string
  email: string
  targetRole: string
}

function loadProfile(user: { name: string; email: string } | null): ProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) return JSON.parse(raw) as ProfileData
  } catch {
    // ignore
  }
  return { name: user?.name ?? '', email: user?.email ?? '', targetRole: '' }
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<ProfileData>(() => loadProfile(user))
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeScore, setResumeScore] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const initials = profile.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  async function handleSave() {
    setIsSaving(true)
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
      if (resumeFile) {
        const resumeText = await resumeFile.text()
        const storedProfile = loadProfile(user)
        const res = await api.resumeAnalysis({
          resume_text: resumeText,
          job_description: storedProfile.targetRole || 'Software Engineer',
        })
        setResumeScore(res.data.resume_score)
        toast.success(`Profile saved! Resume score: ${(res.data.resume_score * 100).toFixed(1)}%`)
      } else {
        toast.success('Profile saved successfully!')
      }
    } catch (err: unknown) {
      const message = (err as { message?: string }).message ?? 'Failed to save profile'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200'

  return (
    <div className="p-5 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your personal information and preferences</p>
      </div>

      <div className="space-y-5">
        {/* Avatar header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-glow-brand shrink-0">
              <span className="text-white text-xl font-black">{initials}</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">{profile.name || 'Your Name'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
              {profile.targetRole && (
                <span className="inline-flex items-center gap-1 mt-1 badge bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                  <User size={10} /> {profile.targetRole}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Edit form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6"
        >
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
              <input type="text" value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className={inputCls} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input type="email" value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className={inputCls} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Target Role</label>
              <input type="text" value={profile.targetRole}
                onChange={(e) => setProfile((p) => ({ ...p, targetRole: e.target.value }))}
                placeholder="e.g. Software Engineer, Data Scientist"
                className={inputCls} />
            </div>
          </div>
        </motion.div>

        {/* Resume upload */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-6"
        >
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Resume Upload</h2>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
              resumeFile
                ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            )}
          >
            {resumeFile ? (
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                <FileText size={20} />
                <span className="text-sm font-medium">{resumeFile.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                <Upload size={24} />
                <p className="text-sm font-medium">Click to upload your resume</p>
                <p className="text-xs">PDF or TXT supported</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)} />

          {/* Resume score result */}
          {resumeScore !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                Resume Score: {(resumeScore * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                Based on your resume and target role
              </p>
              <div className="mt-2 h-1.5 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${resumeScore * 100}%` }}
                  transition={{ duration: 0.8 }} className="h-full bg-emerald-500 rounded-full" />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold',
            'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white',
            'btn-glow transition-all duration-250',
            'disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none'
          )}
        >
          <Save size={16} />
          {isSaving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
