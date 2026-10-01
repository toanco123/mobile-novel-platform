import { History, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'

const VISIBLE_MS = 6000

/** Như ResumeNotice của web: báo vừa mở lại chỗ đọc dở, kèm nút về đầu chương; tự ẩn sau vài giây */
export function ResumeNotice({ top, onBackToTop }: { top: number; onBackToTop: () => void }) {
  const [open, setOpen] = useState(true)
  const colors = useThemeColors()

  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!open) return null
  return (
    <View
      pointerEvents="box-none"
      style={{ top }}
      className="absolute inset-x-0 z-20 items-center px-4"
    >
      <View
        role="status"
        className="flex-row items-center gap-2 rounded-full border border-border bg-popover py-1.5 pr-1.5 pl-4 shadow-lg"
      >
        <History size={16} color={colors.roseGold} />
        <Text className="text-sm text-popover-foreground">Đã mở lại chỗ bạn đọc dở</Text>
        <Pressable
          role="button"
          onPress={() => {
            onBackToTop()
            setOpen(false)
          }}
          className="rounded-full px-2.5 py-1 active:bg-muted"
        >
          <Text className="font-sans-medium text-sm text-rose-gold">Về đầu chương</Text>
        </Pressable>
        <Pressable
          role="button"
          aria-label="Đóng thông báo"
          hitSlop={6}
          onPress={() => setOpen(false)}
          className="rounded-full p-1.5 active:bg-muted"
        >
          <X size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  )
}
