import { Text } from 'react-native'
import { PlaceholderScreen } from '@/components/common/PlaceholderScreen'
import { SITE_NAME } from '@/config/site'
import { useGenres } from '@/features/genres/hooks'

export default function HomeScreen() {
  // Tạm thời: gọi thử Supabase để thấy bộ khung đã nối đúng máy chủ
  const genres = useGenres()
  return (
    <PlaceholderScreen
      title={SITE_NAME}
      description="Banner nổi bật, đề cử, top tuần, mới cập nhật (bước 2 của plan)."
    >
      <Text className="font-sans text-sm text-rose-gold">
        {genres.isPending
          ? 'Đang kết nối máy chủ…'
          : genres.isError
            ? `Lỗi kết nối: ${genres.error.message}`
            : `Đã kết nối máy chủ · ${genres.data.length} thể loại`}
      </Text>
    </PlaceholderScreen>
  )
}
