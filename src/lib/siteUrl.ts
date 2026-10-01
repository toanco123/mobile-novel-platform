import { DEFAULT_SITE_URL } from '@/config/site'

/**
 * Địa chỉ web không có dấu "/" ở cuối, vd https://ten-mien.vn (EXPO_PUBLIC_SITE_URL ghi đè mặc
 * định). App mở các trang chỉ có trên web (Sáng tác, điều khoản...) bằng địa chỉ này.
 */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
