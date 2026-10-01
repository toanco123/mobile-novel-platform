import { useCallback, useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useSaveReadingProgress } from '@/features/library/hooks'
import type { ChapterContent } from '@/types/chapter'

const SAVE_EVERY_MS = 1000
/** Dưới mức này coi như mới mở đầu chương, không cần cuộn tới */
export const MIN_RESUME = 0.03

/**
 * Như useReadingTracker của web: ghi chương vào lịch sử khi mở, lưu vị trí cuộn (tối đa mỗi giây khi
 * đang cuộn, khi rời chương và khi app vào nền). Khác web: `getProgress` do trang đọc tính từ
 * ScrollView (không có DOM); việc cuộn tới chỗ đọc dở (`?resume=`) làm ở trang đọc, cần số đo của
 * ScrollView. Bản lưu chương trên máy (markRead) thêm ở bước 3.
 * Trả về hàm gọi mỗi lần cuộn.
 */
export function useReadingTracker(
  chapter: ChapterContent | null | undefined,
  getProgress: () => number | null,
) {
  const { mutate: save } = useSaveReadingProgress()
  const slug = chapter?.story.slug
  const number = chapter?.number
  const title = chapter?.title
  const progressRef = useRef(getProgress)
  const touchRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    progressRef.current = getProgress
  })

  // Mở chương: đưa truyện lên đầu lịch sử (cùng chương thì giữ vị trí cũ)
  useEffect(() => {
    if (slug === undefined || number === undefined || title === undefined) return
    save({ slug, chapter: number, chapterTitle: title })
  }, [save, slug, number, title])

  useEffect(() => {
    if (slug === undefined || number === undefined || title === undefined) return
    let timer: ReturnType<typeof setTimeout> | undefined
    let dirty = false
    const flush = () => {
      clearTimeout(timer)
      timer = undefined
      if (!dirty) return
      dirty = false
      const progress = progressRef.current()
      if (progress === null) return
      save({ slug, chapter: number, chapterTitle: title, progress })
    }
    touchRef.current = () => {
      dirty = true
      timer ??= setTimeout(flush, SAVE_EVERY_MS)
    }
    // App vào nền (chuyển app, khóa máy): lưu ngay, có thể không quay lại nữa
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flush()
    })
    return () => {
      // Rời chương (chuyển chương, rời trang đọc): lưu vị trí cuối cùng
      flush()
      subscription.remove()
      touchRef.current = null
    }
  }, [save, slug, number, title])

  return useCallback(() => touchRef.current?.(), [])
}
