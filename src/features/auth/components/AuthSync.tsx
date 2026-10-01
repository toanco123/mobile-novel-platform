import { useAuthSync } from '../hooks'

/** Gắn một lần trong layout gốc để cache phiên theo kịp Supabase Auth */
export function AuthSync() {
  useAuthSync()
  return null
}
