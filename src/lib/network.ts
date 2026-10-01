// Nhận biết lỗi do mất mạng / mạng chập chờn (khác lỗi máy chủ trả về), để phần đọc offline dùng
// bản lưu trên máy thay vì báo lỗi. Như src/lib/network.ts của web, nhưng React Native không có
// navigator.onLine nên trạng thái mạng lấy từ NetInfo.
import NetInfo from '@react-native-community/netinfo'

let online = true
NetInfo.addEventListener((state) => {
  // isConnected = null khi chưa biết: coi như có mạng
  online = state.isConnected !== false
})

export const isOnline = () => online

/** Thông báo lỗi fetch của React Native ("Network request failed") và các trình duyệt */
const FETCH_FAILED = /Failed to fetch|NetworkError|Load failed|fetch failed|Network request failed/i

/**
 * Lỗi mạng: máy đang offline, hoặc fetch không tới được máy chủ. supabase-js không ném lỗi fetch
 * mà trả `{ message: 'TypeError: Network request failed', code: '' }`, nên kiểm theo message.
 */
export function isNetworkError(error: unknown): boolean {
  if (!online) return true
  const message = (error as { message?: unknown } | null)?.message
  return typeof message === 'string' && FETCH_FAILED.test(message)
}
