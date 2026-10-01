import { useRef, useState } from 'react'

const TOP_ZONE = 64
const MIN_DELTA = 8

/**
 * Như useAutoHideToolbar của web: ẩn thanh công cụ khi cuộn xuống đọc, hiện lại khi cuộn lên, ở đầu
 * hoặc cuối chương. Web nghe sự kiện scroll của cửa sổ; app gọi `onScroll` từ ScrollView.
 */
export function useAutoHideToolbar() {
  const [visible, setVisible] = useState(true)
  const last = useRef(0)

  const onScroll = (y: number, atBottom: boolean) => {
    if (y < TOP_ZONE || atBottom) setVisible(true)
    else if (Math.abs(y - last.current) >= MIN_DELTA) setVisible(y < last.current)
    else return
    last.current = y
  }

  return [visible, setVisible, onScroll] as const
}
