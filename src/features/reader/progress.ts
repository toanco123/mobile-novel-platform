// Như web: src/features/reader/progress.ts. Web đo phần tử <article> trên DOM; app đo bằng onLayout của
// khối chương và vị trí cuộn của ScrollView, rồi tính bằng các hàm thuần dưới đây.

/** Vị trí khối chương trong ScrollView và vùng nhìn thấy (đơn vị pt) */
export type ArticleMetrics = {
  /** Đầu khối chương tính từ đầu nội dung cuộn */
  top: number
  height: number
  /** Chiều cao vùng nhìn thấy của ScrollView */
  viewport: number
}

/** Tỉ lệ đã đọc 0–1: 0 khi đầu chương ở mép trên màn hình, 1 khi cuối chương chạm mép dưới */
export function progressOf({ top, height, viewport }: ArticleMetrics, scrollY: number) {
  const rectTop = top - scrollY
  const scrollable = height - viewport
  if (scrollable <= 0) return rectTop <= 0 ? 1 : 0
  return Math.min(1, Math.max(0, -rectTop / scrollable))
}

/** Vị trí cuộn để tỉ lệ đã đọc = progress */
export const offsetForProgress = ({ top, height, viewport }: ArticleMetrics, progress: number) =>
  top + progress * Math.max(0, height - viewport)
