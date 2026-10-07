import { router, usePathname } from 'expo-router'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { openWebPage } from '@/features/auth/navigation'

/**
 * Như NotFound của web, cho link mở vào app mà app không có màn tương ứng (Sáng tác, Quản trị, link
 * cũ...): ngoài "Về trang chủ" còn có nút mở đúng đường dẫn đó trên web.
 */
export default function NotFoundScreen() {
  const pathname = usePathname()
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
      <Text
        className="font-heading-bold text-7xl text-muted-foreground"
        // Cormorant mặc định dùng số kiểu cổ: ép số thẳng như lining-nums của web
        style={{ fontVariant: ['lining-nums'] }}
      >
        404
      </Text>
      <Text className="text-center">Trang bạn tìm không có trong ứng dụng.</Text>
      <View className="mt-2 flex-row flex-wrap justify-center gap-3">
        <Button
          onPress={() => router.dismissTo('/')}
          className="h-11 rounded-full px-5"
          textClassName="text-sm"
        >
          Về trang chủ
        </Button>
        <Button
          variant="outline"
          onPress={() => openWebPage(pathname)}
          className="h-11 rounded-full px-5"
          textClassName="text-sm"
        >
          Mở trên web
        </Button>
      </View>
    </View>
  )
}
