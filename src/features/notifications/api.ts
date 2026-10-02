// Thông báo chương mới (riêng của app). Bảng push_tokens, RPC register_push_token và trigger gửi qua
// Expo Push ở migration 20261002025309_push_notifications.sql của web; mục 3, 5, 6
// documents/thiet-ke-database.md bên web.
import { requireUserId } from '@/features/auth/api'
import { unwrap } from '@/lib/dbError'
import { db } from '@/lib/supabase'

export type PushPlatform = 'ios' | 'android'

/** Gắn mã thông báo của máy với tài khoản đang đăng nhập (máy đổi tài khoản thì mã chuyển chủ) */
export async function registerPushToken(token: string, platform: PushPlatform) {
  await requireUserId()
  unwrap(await db().rpc('register_push_token', { p_token: token, p_platform: platform }))
}

/** Gỡ mã của máy khỏi tài khoản (tắt thông báo, trước khi đăng xuất) */
export async function unregisterPushToken(token: string) {
  const me = await requireUserId()
  unwrap(await db().from('push_tokens').delete().eq('token', token).eq('user_id', me))
}
