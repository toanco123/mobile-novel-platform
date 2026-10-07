import type { ErrorBoundaryProps } from 'expo-router'
import { useEffect } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { reportError } from '@/lib/monitoring'

/**
 * Màn thay thế khi một màn hình gặp lỗi lúc hiển thị (ErrorBoundary của Expo Router, export ở
 * `src/app/_layout.tsx`): gửi lỗi lên Sentry và cho thử lại, thay vì app tắt hay màn trắng
 */
export function AppErrorFallback({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    reportError(error, { source: 'error-boundary' })
  }, [error])

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
      <Text className="text-center font-heading-bold text-3xl">Có lỗi xảy ra</Text>
      <Text className="text-center text-muted-foreground">
        Màn hình này không mở được. Bạn thử lại nhé, lỗi đã được báo cho chúng tôi.
      </Text>
      <Button onPress={() => void retry()} className="mt-2 h-11 rounded-full px-6">
        Thử lại
      </Button>
    </View>
  )
}
