// Lỗi ảnh dùng chung với web (src/lib/image.ts). Phần xử lý ảnh của web dùng canvas; app dùng
// expo-image-manipulator, cùng kết quả: cắt giữa ảnh theo khung đích rồi thu nhỏ, xuất WebP.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

const AVATAR_SIZE = 128

export class CoverError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CoverError'
  }
}

/** Vượt hạn mức ảnh tải lên của Storage (policy images_insert_own; quản trị viên không bị giới hạn) */
export class ImageLimitError extends CoverError {
  constructor() {
    super('Bạn đã tải lên quá nhiều ảnh (tối đa 30 ảnh mỗi ngày, 300 ảnh tất cả). Thử lại sau nhé.')
    this.name = 'ImageLimitError'
  }
}

/**
 * Ảnh đại diện từ ảnh vừa chọn (file trên máy): cắt vuông ở giữa, 128×128, WebP. Trả về file mới
 * (file://), updateProfile upload lên Storage khi lưu hồ sơ.
 */
export async function prepareAvatar(uri: string): Promise<string> {
  try {
    const image = await ImageManipulator.manipulate(uri).renderAsync()
    const side = Math.min(image.width, image.height)
    const square = await ImageManipulator.manipulate(image)
      .crop({
        originX: Math.floor((image.width - side) / 2),
        originY: Math.floor((image.height - side) / 2),
        width: side,
        height: side,
      })
      .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE })
      .renderAsync()
    const saved = await square.saveAsync({ format: SaveFormat.WEBP, compress: 0.85 })
    return saved.uri
  } catch {
    throw new CoverError('Không đọc được ảnh này. Thử một ảnh khác nhé.')
  }
}
