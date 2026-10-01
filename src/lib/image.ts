// Lỗi ảnh dùng chung với web (src/lib/image.ts). Phần xử lý ảnh của web (canvas) không chép sang:
// app chọn và cắt ảnh bằng expo-image-picker + expo-image-manipulator.

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
