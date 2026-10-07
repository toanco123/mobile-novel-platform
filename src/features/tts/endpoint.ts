// Như endpoint.ts của web nhưng là địa chỉ đầy đủ: app gọi hàm Vercel api/tts của web
import { SITE_URL } from '@/lib/siteUrl'

export const TTS_ENDPOINT = `${SITE_URL}/api/tts`
