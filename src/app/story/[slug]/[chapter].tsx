import { useLocalSearchParams } from 'expo-router'
import { PlaceholderScreen } from '@/components/common/PlaceholderScreen'

// Tạm thời (2a): trang đọc làm ở phần 2c của plan-trang-chu-va-doc-truyen.md
export default function ChapterScreen() {
  const { chapter } = useLocalSearchParams<{ slug: string; chapter: string }>()
  return (
    <PlaceholderScreen
      title={chapter?.replace('chapter-', 'Chương ') ?? 'Đọc truyện'}
      description="Nội dung chương, cài đặt đọc, chương trước/sau (phần 2c)."
    />
  )
}
