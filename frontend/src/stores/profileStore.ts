import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id?: string
  name: string
  email: string
  phone: string
  college: string
  degree: string
  branch: string
  year: number
  cgpa: number
  target_role: string
  domain: string
  tech_stack: string[]
  skills: string[]
  target_skills: string[]
  project_count: number
  project_description: string
  has_internship: boolean
  internship_details: string
  profile_image_url: string
}

export const EMPTY_PROFILE: UserProfile = {
  name: '', email: '', phone: '', college: '', degree: '', branch: '',
  year: 1, cgpa: 0, target_role: '', domain: '', tech_stack: [], skills: [],
  target_skills: [], project_count: 0, project_description: '',
  has_internship: false, internship_details: '', profile_image_url: '',
}

interface ProfileState {
  profile: UserProfile
  loading: boolean
  saving: boolean
  error: string
  fetchProfile: () => Promise<void>
  saveProfile: (data: UserProfile) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  setProfile: (data: Partial<UserProfile>) => void
}

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: EMPTY_PROFILE,
  loading: false,
  saving: false,
  error: '',

  setProfile: (data) => set(s => ({ profile: { ...s.profile, ...data } })),

  fetchProfile: async () => {
    set({ loading: true, error: '' })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { set({ loading: false }); return }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error  // PGRST116 = no rows

      if (data) {
        set({
          profile: {
            ...EMPTY_PROFILE,
            ...data,
            tech_stack: data.tech_stack ?? [],
            skills: data.skills ?? [],
            target_skills: data.target_skills ?? [],
          },
          loading: false,
        })
      } else {
        // Pre-fill from auth metadata
        set({
          profile: {
            ...EMPTY_PROFILE,
            name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
            email: user.email ?? '',
          },
          loading: false,
        })
      }
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Failed to load profile', loading: false })
    }
  },

  saveProfile: async (data) => {
    set({ saving: true, error: '' })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        id: user.id,
        ...data,
        email: user.email ?? data.email,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })

      if (error) throw error
      set({ profile: data, saving: false })
    } catch (err: unknown) {
      set({ error: (err as { message?: string }).message ?? 'Failed to save profile', saving: false })
      throw err
    }
  },

  uploadAvatar: async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `avatars/${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      if (uploadError.message.includes('row-level security') || uploadError.message.includes('Bucket not found')) {
        throw new Error('Storage not configured. Run this in Supabase SQL Editor:\n\ncreate policy "profiles_all" on storage.objects for all to authenticated using (bucket_id = \'profiles\') with check (bucket_id = \'profiles\');')
      }
      throw uploadError
    }

    const { data } = supabase.storage.from('profiles').getPublicUrl(path)
    return data.publicUrl
  },
}))

// Completion score
export function profileCompletion(p: UserProfile): { score: number; missing: string[] } {
  const checks: [boolean, string][] = [
    [!!p.name, 'Full Name'],
    [!!p.phone, 'Phone Number'],
    [!!p.college, 'College'],
    [!!p.degree, 'Degree'],
    [!!p.branch, 'Branch'],
    [p.cgpa > 0, 'CGPA'],
    [!!p.target_role, 'Target Role'],
    [!!p.domain, 'Preferred Domain'],
    [p.tech_stack.length > 0, 'Tech Stack'],
    [p.skills.length > 0, 'Current Skills'],
    [p.project_count > 0, 'Projects'],
    [!!p.profile_image_url, 'Profile Photo'],
  ]
  const done = checks.filter(([v]) => v).length
  const missing = checks.filter(([v]) => !v).map(([, l]) => l)
  return { score: Math.round((done / checks.length) * 100), missing }
}
