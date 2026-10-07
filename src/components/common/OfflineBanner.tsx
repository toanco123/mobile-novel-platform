import { router } from 'expo-router'
import { WifiOff } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { useOnline } from '@/hooks/useOnline'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'

/**
 * Như OfflineBanner của web: dải báo mất mạng, vì các màn cần mạng chỉ hiện khung chờ (query tạm dừng
 * khi offline). Web đặt dưới header; app đặt dưới cùng thân màn (trên thanh tab) để không đụng header.
 * `safeBottom`: dải nằm sát mép dưới màn hình (màn không có thanh tab) nên chừa chỗ cho thanh home.
 */
export function OfflineBanner({ safeBottom = false }: { safeBottom?: boolean }) {
  const online = useOnline()
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  if (online) return null
  return (
    <View
      role="status"
      className="flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-border bg-secondary px-4 pt-2"
      style={{ paddingBottom: 8 + (safeBottom ? insets.bottom : 0) }}
    >
      <WifiOff size={16} color={colors.foreground} />
      <Text className="text-sm">Bạn đang offline.</Text>
      <Pressable role="link" hitSlop={8} onPress={() => router.navigate(links.savedChapters)}>
        <Text className="font-sans-medium text-sm text-rose-gold">Xem truyện đã lưu</Text>
      </Pressable>
    </View>
  )
}

/** Cho `screenLayout` của navigator: thân màn co lại phía trên, dải offline nằm dưới cùng */
export function OfflineBannerLayout({
  children,
  safeBottom,
}: {
  children: ReactNode
  safeBottom?: boolean
}) {
  return (
    <View className="flex-1">
      {children}
      <OfflineBanner safeBottom={safeBottom} />
    </View>
  )
}
