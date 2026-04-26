import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save, Upload, Camera, CheckCircle2, AlertCircle,
  User, GraduationCap, Briefcase, Code2, X, Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore, profileCompletion, EMPTY_PROFILE } from '@/stores/profileStore'
import { useToast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────
const DEGREES = ['B.Tech', 'B.E.', 'BCA', 'B.Sc CS', 'MCA', 'M.Tech', 'MBA', 'Other']
const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Data Science', 'AI/ML', 'Other']
const DOMAINS = ['Web Dev', 'AI/ML', 'Data Science', 'Backend', 'DevOps', 'Mobile', 'SDE', 'Cloud', 'Cybersecurity']
const ROLES = ['SDE', 'Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Data Analyst', 'Product Manager']
const COMMON_SKILLS = ['Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'C++', 'SQL', 'Machine Learning', 'Docker', 'AWS', 'Git', 'TensorFlow', 'Data Structures', 'Algorithms', 'System Design']

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all'

// ── Tag input ─────────────────────────────────────────────────────────────────
function TagInput({ label, tags, onChange, suggestions }: {
  label: string; tags: string[]; onChange: (t: string[]) => void; suggestions?: string[]
}) {
  const [input, setInput] = useState('')
  function add(s: string) {
    const v = s.trim()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
      <div className="flex gap-2 mb-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add(input))}
          placeholder="Type and press Enter" className={cn(inputCls, 'flex-1')} />
        <button type="button" onClick={() => add(input)}
          className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-all">Add</button>
      </div>
      {suggestions && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestions.filter(s => !tags.includes(s)).slice(0, 6).map(s => (
            <button key={s} type="button" onClick={() => add(s)}
              className="px-2 py-0.5 rounded-full text-xs border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all">
              + {s}
            </button>
          ))}
        </div>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {t}<button type="button" onClick={() => onChange(tags.filter(x => x !== t))}><X size={10} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, children, delay = 0 }: { title: string; icon: React.ReactNode; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">{icon}</div>
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      </div>
      {children}
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ProfilePage() {
  const user = useAuthStore(s => s.user)
  const { profile, loading, saving, error, fetchProfile, saveProfile, uploadAvatar, setProfile } = useProfileStore()
  const toast = useToast()
  const avatarRef = useRef<HTMLInputElement>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'academic' | 'career' | 'skills'>('basic')

  useEffect(() => { fetchProfile() }, [])

  const { score, missing } = profileCompletion(profile)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Only JPG, PNG, or WebP allowed'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    setAvatarLoading(true)
    try {
      const url = await uploadAvatar(file)
      // Update local state
      setProfile({ profile_image_url: url })
      // Immediately persist to Supabase so it survives navigation
      await saveProfile({ ...profile, profile_image_url: url })
      toast.success('Photo updated!')
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message ?? 'Upload failed')
    } finally {
      setAvatarLoading(false)
    }
  }

  async function handleSave() {
    if (!profile.name.trim()) { toast.error('Full name is required'); return }
    if (profile.cgpa < 0 || profile.cgpa > 10) { toast.error('CGPA must be between 0 and 10'); return }
    if (profile.phone && !/^\+?[\d\s\-()]{7,15}$/.test(profile.phone)) { toast.error('Invalid phone number'); return }
    try {
      await saveProfile(profile)
      toast.success('Profile saved successfully!')
    } catch {
      toast.error(error || 'Failed to save profile')
    }
  }

  const initials = profile.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const TABS = [
    { key: 'basic', label: 'Basic', icon: <User size={13} /> },
    { key: 'academic', label: 'Academic', icon: <GraduationCap size={13} /> },
    { key: 'career', label: 'Career', icon: <Briefcase size={13} /> },
    { key: 'skills', label: 'Skills', icon: <Code2 size={13} /> },
  ] as const

  if (loading) {
    return (
      <div className="p-5 md:p-6 max-w-3xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your information — used across all AI modules</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold btn-glow transition-all disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>

      {/* Completion bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Profile Completion</span>
          <span className={cn('text-sm font-black tabular-nums', score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500')}>{score}%</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
          <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.8 }}
            className={cn('h-full rounded-full', score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500')} />
        </div>
        {missing.length > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500">Missing: {missing.slice(0, 4).join(', ')}{missing.length > 4 ? ` +${missing.length - 4} more` : ''}</p>
        )}
      </motion.div>

      {/* Avatar + name card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-sm">
              {profile.profile_image_url ? (
                <img src={profile.profile_image_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-black">{initials}</span>
              )}
            </div>
            <button onClick={() => avatarRef.current?.click()} disabled={avatarLoading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm transition-all">
              {avatarLoading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
            </button>
            <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white text-lg truncate">{profile.name || 'Your Name'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{profile.email || user?.email}</p>
            {profile.target_role && (
              <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-medium">
                🎯 {profile.target_role}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === tab.key ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300')}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'basic' && (
          <motion.div key="basic" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="space-y-4">
            <Section title="Basic Information" icon={<User size={14} />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Full Name *</label>
                  <input type="text" value={profile.name} onChange={e => setProfile({ name: e.target.value })}
                    placeholder="Jane Doe" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
                  <input type="email" value={profile.email || user?.email || ''} readOnly
                    className={cn(inputCls, 'opacity-60 cursor-not-allowed')} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Phone Number</label>
                  <input type="tel" value={profile.phone} onChange={e => setProfile({ phone: e.target.value })}
                    placeholder="+91 98765 43210" className={inputCls} />
                </div>
              </div>
            </Section>
          </motion.div>
        )}

        {activeTab === 'academic' && (
          <motion.div key="academic" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="space-y-4">
            <Section title="Academic Information" icon={<GraduationCap size={14} />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">College / University</label>
                  <input type="text" value={profile.college} onChange={e => setProfile({ college: e.target.value })}
                    placeholder="IIT Delhi, VIT Vellore..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Degree</label>
                  <select value={profile.degree} onChange={e => setProfile({ degree: e.target.value })} className={inputCls}>
                    <option value="">Select degree</option>
                    {DEGREES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Branch</label>
                  <select value={profile.branch} onChange={e => setProfile({ branch: e.target.value })} className={inputCls}>
                    <option value="">Select branch</option>
                    {BRANCHES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Year of Study</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(y => (
                      <button key={y} type="button" onClick={() => setProfile({ year: y })}
                        className={cn('flex-1 py-2 rounded-xl text-sm font-semibold border transition-all',
                          profile.year === y ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400')}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    CGPA: <span className="text-blue-600 dark:text-blue-400 font-bold">{profile.cgpa.toFixed(1)}</span>
                  </label>
                  <input type="range" min={0} max={10} step={0.1} value={profile.cgpa}
                    onChange={e => setProfile({ cgpa: Number(e.target.value) })} className="w-full accent-blue-500" />
                  <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0</span><span>10</span></div>
                </div>
              </div>
            </Section>
          </motion.div>
        )}

        {activeTab === 'career' && (
          <motion.div key="career" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="space-y-4">
            <Section title="Career Goals" icon={<Briefcase size={14} />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Target Role</label>
                  <select value={profile.target_role} onChange={e => setProfile({ target_role: e.target.value })} className={inputCls}>
                    <option value="">Select role</option>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Preferred Domain</label>
                  <select value={profile.domain} onChange={e => setProfile({ domain: e.target.value })} className={inputCls}>
                    <option value="">Select domain</option>
                    {DOMAINS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Projects Built: <span className="text-blue-600 dark:text-blue-400 font-bold">{profile.project_count}</span>
                  </label>
                  <input type="range" min={0} max={15} step={1} value={profile.project_count}
                    onChange={e => setProfile({ project_count: Number(e.target.value) })} className="w-full accent-blue-500" />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input type="checkbox" id="intern" checked={profile.has_internship}
                    onChange={e => setProfile({ has_internship: e.target.checked })} className="w-4 h-4 accent-blue-500" />
                  <label htmlFor="intern" className="text-sm text-slate-700 dark:text-slate-300 font-medium">I have internship experience</label>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Project Description</label>
                  <textarea value={profile.project_description} onChange={e => setProfile({ project_description: e.target.value })}
                    rows={3} placeholder="Briefly describe your key projects..."
                    className={cn(inputCls, 'resize-none')} />
                </div>
                {profile.has_internship && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Internship Details</label>
                    <textarea value={profile.internship_details} onChange={e => setProfile({ internship_details: e.target.value })}
                      rows={2} placeholder="Company, role, duration..."
                      className={cn(inputCls, 'resize-none')} />
                  </div>
                )}
              </div>
            </Section>
          </motion.div>
        )}

        {activeTab === 'skills' && (
          <motion.div key="skills" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="space-y-4">
            <Section title="Skills & Tech Stack" icon={<Code2 size={14} />}>
              <div className="space-y-5">
                <TagInput label="Tech Stack" tags={profile.tech_stack} onChange={v => setProfile({ tech_stack: v })} suggestions={COMMON_SKILLS} />
                <TagInput label="Current Skills" tags={profile.skills} onChange={v => setProfile({ skills: v })} suggestions={COMMON_SKILLS} />
                <TagInput label="Target Skills (to learn)" tags={profile.target_skills} onChange={v => setProfile({ target_skills: v })} suggestions={COMMON_SKILLS.filter(s => !profile.skills.includes(s))} />
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save button (bottom) */}
      <button onClick={handleSave} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold btn-glow transition-all disabled:opacity-60">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'Saving…' : 'Save Profile'}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={14} />{error}
        </div>
      )}
    </div>
  )
}
