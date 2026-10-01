import 'expo-sqlite/localStorage/install'
import { createClient } from '@supabase/supabase-js'
import { AppState } from 'react-native'
import type { Database } from '@/types/database'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// App không có bản dữ liệu giả như web: thiếu cấu hình thì báo ngay lúc mở app
if (!url || !anonKey) {
  throw new Error(
    'Thiếu EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY trong .env (xem .env.example)',
  )
}

/**
 * Kiểu Database sinh từ schema: npm run gen:types (DB do web-novel-platform quản lý).
 * Phiên đăng nhập lưu ở localStorage của expo-sqlite. App tự đổi ?code= lấy phiên trong
 * completeAuthRedirect (features/auth/api.ts), nên tắt detectSessionInUrl.
 */
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
})

// Chỉ làm mới token khi app đang mở (khuyến nghị của Supabase cho React Native)
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh()
  else supabase.auth.stopAutoRefresh()
})

/** Client cho các api.ts (giữ tên như web để code chép từ api.remote.ts không phải sửa) */
export const db = () => supabase
