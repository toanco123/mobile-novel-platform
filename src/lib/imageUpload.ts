// Ảnh đại diện (và ảnh bìa khi xóa tài khoản) trên Supabase Storage. Như src/lib/imageUpload.ts
// của web, nhưng ảnh mới chọn là file trên máy (file://, do expo-image-manipulator lưu) thay vì
// data URL. Upload vào {user_id}/{uuid}.{ext}: tên ngẫu nhiên nên đổi ảnh không bị cache ảnh cũ.
import { randomUUID } from 'expo-crypto'
import { File } from 'expo-file-system'
import { ImageLimitError } from './image'
import { db } from './supabase'

export type ImageBucket = 'covers' | 'avatars'

/** Ảnh mới chọn trên máy, chưa upload */
export const isLocalImage = (value: string | null | undefined): value is string =>
  !!value && value.startsWith('file:')

export const publicImageUrl = (bucket: ImageBucket, path: string) =>
  db().storage.from(bucket).getPublicUrl(path).data.publicUrl

/** Đường dẫn trong bucket từ public URL của chính bucket đó; null nếu là URL ngoài (vd ảnh Google) */
export function imagePathFromUrl(bucket: ImageBucket, url: string | null | undefined) {
  if (!url) return null
  const prefix = publicImageUrl(bucket, '')
  return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null
}

/** Upload ảnh (file trên máy) vào thư mục của người dùng, trả về đường dẫn trong bucket */
export async function uploadImage(bucket: ImageBucket, userId: string, uri: string) {
  const file = new File(uri)
  const contentType = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp'
  const ext = contentType === 'image/jpeg' ? 'jpg' : 'webp'
  const path = `${userId}/${randomUUID()}.${ext}`
  const { error } = await db()
    .storage.from(bucket)
    .upload(path, await file.bytes(), { contentType, cacheControl: '31536000', upsert: false })
  // Luôn ghi vào thư mục của chính mình nên bị RLS chặn nghĩa là vượt hạn mức ảnh
  if (error) throw /row-level security/i.test(error.message) ? new ImageLimitError() : error
  return path
}

/** Xóa mọi ảnh trong thư mục của người dùng (khi xóa tài khoản) */
export async function removeUserImages(bucket: ImageBucket, userId: string) {
  const { data, error } = await db().storage.from(bucket).list(userId, { limit: 1000 })
  if (error) throw error
  const paths = data.map((file) => `${userId}/${file.name}`)
  if (paths.length) {
    const { error: removeError } = await db().storage.from(bucket).remove(paths)
    if (removeError) throw removeError
  }
}

/** Xóa ảnh cũ; lỗi thì bỏ qua (chỉ để lại file thừa, không ảnh hưởng dữ liệu) */
export async function removeImage(bucket: ImageBucket, path: string | null | undefined) {
  if (!path) return
  await db().storage.from(bucket).remove([path])
}
