import { usePendingProgressSync } from '../hooks'

/** Như web: gắn một lần ở layout gốc, gửi lịch sử đọc ghi lúc mất mạng khi có mạng lại */
export function OfflineSync() {
  usePendingProgressSync()
  return null
}
