import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export type NotificationType = 'login' | 'module' | 'achievement' | 'system'

export interface AppNotification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

interface NotificationState {
  notifications: AppNotification[]
  loading: boolean
  // Actions
  fetch: () => Promise<void>
  add: (n: Omit<AppNotification, 'id' | 'user_id' | 'created_at' | 'is_read'>) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  subscribeRealtime: () => () => void
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { set({ loading: false }); return }
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (!error && data) set({ notifications: data as AppNotification[] })
    } finally {
      set({ loading: false })
    }
  },

  add: async (n) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase
        .from('notifications')
        .insert({ ...n, user_id: user.id, is_read: false })
        .select()
        .single()
      if (!error && data) {
        set(s => ({ notifications: [data as AppNotification, ...s.notifications] }))
      }
    } catch {
      // Silently fail — notifications are non-critical
    }
  },

  markRead: async (id) => {
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, is_read: true } : n)
    }))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  },

  markAllRead: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, is_read: true })) }))
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  },

  subscribeRealtime: () => {
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        const newNotif = payload.new as AppNotification
        set(s => {
          // Only add if it belongs to current user and not already present
          const exists = s.notifications.some(n => n.id === newNotif.id)
          if (exists) return s
          return { notifications: [newNotif, ...s.notifications] }
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },
}))

// Helper to add a notification from anywhere
export async function pushNotification(
  title: string,
  message: string,
  type: NotificationType = 'system'
) {
  await useNotificationStore.getState().add({ title, message, type })
}
