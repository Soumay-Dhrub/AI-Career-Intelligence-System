/**
 * useNotify — convenience hook to push module completion notifications.
 * Usage: const notify = useNotify()
 *        notify.moduleComplete('Resume Analyzer')
 */
import { pushNotification } from '@/stores/notificationStore'

const MODULE_NAMES = [
  'Burnout & Consistency',
  'Resume Analyzer',
  'Internship Predictor',
  'Failure Analysis',
  'Roadmap Generator',
  'Placement Predictor',
]

// Track completed modules in sessionStorage
function getCompleted(): string[] {
  try { return JSON.parse(sessionStorage.getItem('completed_modules') ?? '[]') } catch { return [] }
}
function setCompleted(modules: string[]) {
  try { sessionStorage.setItem('completed_modules', JSON.stringify(modules)) } catch {}
}

export function useNotify() {
  return {
    moduleComplete: async (moduleName: string) => {
      await pushNotification(
        `Module '${moduleName}' completed successfully ✅`,
        `You completed the ${moduleName} module successfully.`,
        'module'
      )
      const completed = getCompleted()
      if (!completed.includes(moduleName)) {
        const updated = [...completed, moduleName]
        setCompleted(updated)
        const allDone = MODULE_NAMES.every(m => updated.includes(m))
        if (allDone) {
          await pushNotification(
            'Congratulations! You have completed all modules 🎯',
            'Amazing work — you have completed every module in PlaceReady.',
            'achievement'
          )
        }
      }
    },

    custom: async (title: string, message: string) => {
      await pushNotification(title, message, 'system')
    },
  }
}
