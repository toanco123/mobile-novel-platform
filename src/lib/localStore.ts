// Đọc/ghi JSON trên máy cho dữ liệu chỉ nằm ở thiết bị này (hồ sơ lần tải trước, lịch sử đọc của
// khách, hàng chờ chỗ đọc chưa gửi). Tương ứng src/lib/mockStorage.ts của web: dùng `localStorage`
// của expo-sqlite (đọc ghi đồng bộ như trình duyệt), cùng kho với phiên đăng nhập của supabase-js.
import 'expo-sqlite/localStorage/install'

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

/** null thì xóa khóa */
export function writeLocal(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Không ghi được (bộ nhớ đầy...): dữ liệu chỉ sống tới khi tắt app
  }
}
