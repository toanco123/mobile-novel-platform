import type { ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/** Như FloatingBar của web: khung thanh điều khiển nổi ở đáy trang đọc (nghe truyện, tự cuộn) */
export function FloatingBar({ label, children }: { label: string; children: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View
      pointerEvents="box-none"
      style={{ paddingBottom: Math.max(12, insets.bottom) }}
      className="absolute inset-x-0 bottom-0 z-40 items-center px-3"
    >
      <View
        role="toolbar"
        aria-label={label}
        className="w-full max-w-lg flex-row items-center gap-1 rounded-full border border-border bg-popover p-1.5 shadow-2xl"
      >
        {children}
      </View>
    </View>
  )
}
