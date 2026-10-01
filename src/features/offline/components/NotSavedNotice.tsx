import { router } from 'expo-router'
import { WifiOff } from 'lucide-react-native'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'

/** Như NotSavedNotice của web: mất mạng mà chương chưa được lưu (trang đọc) */
export function NotSavedNotice({ number, onRetry }: { number: number; onRetry: () => void }) {
  const colors = useThemeColors()
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
      <WifiOff size={32} color={colors.mutedForeground} />
      <Text className="text-center">Chương {number} chưa được lưu để đọc offline.</Text>
      <Text className="text-center text-sm text-muted-foreground">
        Có mạng lại thì bấm "Thử lại", hoặc đọc các truyện đã lưu trên máy.
      </Text>
      <View className="flex-row flex-wrap justify-center gap-3">
        <Button onPress={onRetry} className="h-11 rounded-full px-5" textClassName="text-sm">
          Thử lại
        </Button>
        {/* Tab Đã lưu thêm ở 3c; tạm mở Tủ truyện */}
        <Button
          variant="outline"
          onPress={() => router.navigate('/library')}
          className="h-11 rounded-full px-5"
          textClassName="text-sm"
        >
          Truyện đã lưu
        </Button>
      </View>
    </View>
  )
}
