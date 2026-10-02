// Như web: src/features/reader/autoscroll/useAutoScroll.ts. Khác web: cuộn ScrollView của trang đọc
// (không có window); người đọc tự cuộn trên điện thoại luôn là kéo tay, nên nhận biết bằng sự kiện kéo
// / trôi của ScrollView (`frame().touching`) thay cho so vị trí. Chế độ cuộn liên tục: 5b.
import { type RefObject, useEffect, useRef, useState } from 'react'
import { useReaderSettings } from '../useReaderSettings'
import { estimatedPixelsPerWord, pixelsPerSecond, pixelsPerWord, stepSpeed } from './pace'
import { useAutoScrollSettings } from './useAutoScrollSettings'

export type AutoScrollStatus = 'off' | 'running' | 'paused'

/** Số đo tức thời của trang đọc, đọc mỗi khung hình */
export type AutoScrollFrame = {
  scrollY: number
  viewport: number
  /** Đáy khối chương (tính từ đầu nội dung cuộn) */
  articleBottom: number
  /** Chiều cao phần nội dung chương (không tính đầu chương) */
  bodyHeight: number
  /** Đang chạm / kéo / trôi: đứng yên */
  touching: boolean
  /** Đang mở bảng mục lục, cài đặt: đứng yên */
  blocked: boolean
}

export type AutoScroll = {
  status: AutoScrollStatus
  /** Đã tới cuối chương */
  atEnd: boolean
  /** Bội số của tốc độ đọc trung bình */
  speed: number
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  faster: () => void
  slower: () => void
  /** Trang đọc gọi khi cuộn: người đọc kéo ngược lên thì thanh trở lại bình thường */
  check: () => void
}

/** Chừa chỗ cho thanh nổi ở đáy: hết chương khi cuối chương đã lên trên mép này */
const BAR_SPACE = 96
/** Khung hình dài nhất được tính, để quay lại app không bị nhảy xa */
const MAX_FRAME_MS = 100
/** Đo lại số px mỗi chữ sau mỗi khoảng này (đổi cỡ chữ, xoay màn hình) */
const MEASURE_MS = 1000

const isEnd = (f: AutoScrollFrame) =>
  f.articleBottom > 0 && f.articleBottom <= f.scrollY + f.viewport - BAR_SPACE

// Nút "Chương sau" trên thanh tự cuộn: màn chương sau mở ra thì cuộn tiếp từ đầu chương (như
// continueAt của web; mỗi chương là một màn riêng nên ghi ở module)
let continueAt: { slug: string; chapter: number } | null = null
export const continueAutoScrollAt = (slug: string, chapter: number) => {
  continueAt = { slug, chapter }
}

/**
 * Tự động cuộn trang đọc: đứng yên khi người đọc đang chạm / kéo hoặc đang mở bảng; người đọc kéo
 * tới đâu thì cuộn tiếp từ đó; tới cuối chương thì tự tạm dừng.
 */
export function useAutoScroll({
  slug,
  chapter,
  words,
  frameRef,
  scrollTo,
}: {
  slug: string
  chapter: number
  /** Số chữ của chương */
  words: number
  /** Số đo tức thời do trang đọc cập nhật (onLayout, onScroll, kéo / thả) */
  frameRef: RefObject<AutoScrollFrame>
  scrollTo: (y: number) => void
}): AutoScroll {
  const { speed, update } = useAutoScrollSettings()
  const [status, setStatus] = useState<AutoScrollStatus>(() => {
    // Tới từ nút "Chương sau" của thanh tự cuộn: cuộn tiếp luôn
    if (continueAt?.slug !== slug || continueAt.chapter !== chapter) return 'off'
    continueAt = null
    return 'running'
  })
  const [atEnd, setAtEnd] = useState(false)
  // Giá trị mới nhất cho vòng cuộn đang chạy
  const latest = useRef({ words, speed, scrollTo })
  useEffect(() => {
    latest.current = { words, speed, scrollTo }
  })

  // Vòng cuộn: giữ vị trí đích dạng số thực để tốc độ chậm vẫn mượt, không cộng dồn sai số làm tròn
  useEffect(() => {
    if (status !== 'running') return
    let raf = 0
    let last: number | null = null
    let target = frameRef.current.scrollY
    let measuredAt = -Infinity
    let pxPerWord = 0

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = last === null ? 0 : Math.min(now - last, MAX_FRAME_MS)
      last = now
      const { words, speed, scrollTo } = latest.current
      const f = frameRef.current
      // Đang chạm, kéo, trôi hoặc mở bảng: đứng yên, lần sau đi tiếp từ chỗ mới
      if (f.touching || f.blocked) {
        target = f.scrollY
        return
      }
      if (isEnd(f)) {
        setAtEnd(true)
        setStatus('paused')
        return
      }
      if (now - measuredAt >= MEASURE_MS) {
        const { fontSize, lineHeight } = useReaderSettings.getState()
        pxPerWord = pixelsPerWord(f.bodyHeight, words, estimatedPixelsPerWord(fontSize, lineHeight))
        measuredAt = now
      }
      target += (pixelsPerSecond(pxPerWord, speed) * dt) / 1000
      scrollTo(target)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [status, frameRef])

  return {
    status,
    atEnd: status !== 'off' && atEnd,
    speed,
    start: () => {
      setAtEnd(false)
      setStatus('running')
    },
    pause: () => setStatus((s) => (s === 'running' ? 'paused' : s)),
    resume: () => setStatus((s) => (s === 'paused' ? 'running' : s)),
    stop: () => setStatus('off'),
    faster: () => update({ speed: stepSpeed(speed, 1) }),
    slower: () => update({ speed: stepSpeed(speed, -1) }),
    check: () => {
      if (status === 'off') return
      const end = isEnd(frameRef.current)
      if (end !== atEnd) setAtEnd(end)
    },
  }
}
