// Chặn người dùng (riêng của app: web chưa có giao diện). Bảng user_blocks và policy ẩn bình luận
// của người mình đã chặn ở migration 20261002021134_user_blocks.sql của web; mục 3, 5
// documents/thiet-ke-database.md bên web. Chặn rồi thì bình luận, trả lời của người đó tự biến mất
// khỏi mọi truy vấn bình luận (RLS), client không phải lọc.
import { AuthError, requireUserId } from '@/features/auth/api'
import { isUniqueViolation, unwrap } from '@/lib/dbError'
import { db } from '@/lib/supabase'
import type { User } from '@/types/user'

export type BlockedUser = {
  user: Pick<User, 'id' | 'displayName' | 'avatarUrl'>
  blockedAt: string
}

/** Tự chặn mình (check user_blocks_not_self) */
const CHECK_VIOLATION = '23514'

export async function blockUser(userId: string) {
  await requireUserId()
  const { error } = await db().from('user_blocks').insert({ blocked_id: userId })
  // Đã chặn từ trước (bấm hai lần, máy khác): coi như xong
  if (!error || isUniqueViolation(error)) return
  if (error.code === CHECK_VIOLATION)
    throw new AuthError('unknown', 'Bạn không thể chặn chính mình.')
  throw error
}

export async function unblockUser(userId: string) {
  const me = await requireUserId()
  unwrap(await db().from('user_blocks').delete().eq('blocker_id', me).eq('blocked_id', userId))
}

/** Người mình đã chặn, chặn gần nhất trước */
export async function getBlockedUsers(): Promise<BlockedUser[]> {
  await requireUserId()
  const rows = unwrap(
    await db()
      .from('user_blocks')
      .select('created_at, user:profiles!user_blocks_blocked_id_fkey(id, display_name, avatar_url)')
      .order('created_at', { ascending: false }),
  )
  return rows.map((row) => ({
    user: { id: row.user.id, displayName: row.user.display_name, avatarUrl: row.user.avatar_url },
    blockedAt: row.created_at,
  }))
}
