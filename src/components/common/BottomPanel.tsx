import { X } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  /**
   * auto: cao theo nội dung, tối đa 75% màn hình (nội dung dài tự đặt ScrollView);
   * tall: cố định 85% (danh sách FlatList cần khung có chiều cao)
   */
  size?: 'auto' | 'tall'
  /** Lớp phủ trong suốt để vừa chỉnh vừa thấy nội dung phía sau thay đổi (cài đặt đọc) */
  clearBackdrop?: boolean
  children: ReactNode
}

/** Bảng trượt từ dưới lên (Sheet của web); chạm ra ngoài hoặc nút X để đóng */
export function BottomPanel({
  open,
  onClose,
  title,
  description,
  size = 'auto',
  clearBackdrop = false,
  children,
}: Props) {
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          aria-label="Đóng"
          onPress={onClose}
          className={cn('absolute inset-0', !clearBackdrop && 'bg-black/40')}
        />
        <View
          aria-modal
          className="rounded-t-2xl border-t border-border bg-card"
          style={[
            size === 'tall' ? { height: '85%' } : { maxHeight: '75%' },
            { paddingBottom: insets.bottom },
          ]}
        >
          <View className="flex-row items-start gap-3 px-4 pt-4 pb-3">
            <View className="flex-1">
              <Text role="heading" className="font-heading-bold text-2xl">
                {title}
              </Text>
              {description ? (
                <Text numberOfLines={2} className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </Text>
              ) : null}
            </View>
            <Pressable
              role="button"
              aria-label="Đóng"
              hitSlop={8}
              onPress={onClose}
              className="size-9 items-center justify-center rounded-full active:bg-muted"
            >
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  )
}
