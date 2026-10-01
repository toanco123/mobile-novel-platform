// Kiểu của Expo (process.env, require...). expo-env.d.ts cũng tham chiếu file này nhưng chỉ được
// sinh khi chạy `expo start`; khai báo ở đây để `npm run typecheck` chạy được trên bản clone mới.
/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL?: string
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string
    /** Nút đăng nhập mạng xã hội được hiện, vd "google, facebook" (như VITE_AUTH_PROVIDERS) */
    EXPO_PUBLIC_AUTH_PROVIDERS?: string
    /** Site key Cloudflare Turnstile (như VITE_TURNSTILE_SITE_KEY); bỏ trống = không có captcha */
    EXPO_PUBLIC_TURNSTILE_SITE_KEY?: string
    /** Địa chỉ web, mặc định DEFAULT_SITE_URL (src/config/site.ts) */
    EXPO_PUBLIC_SITE_URL?: string
  }
}
