import { Stack, useLocalSearchParams } from 'expo-router'
import { PlaceholderScreen } from '@/components/common/PlaceholderScreen'
import { useStory } from '@/features/stories/hooks'

// Tạm thời (2a): màn chi tiết truyện làm ở phần 2b của plan-trang-chu-va-doc-truyen.md
export default function StoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { data: story } = useStory(slug)
  return (
    <>
      <Stack.Screen options={{ title: story?.title ?? '' }} />
      <PlaceholderScreen
        title={story?.title ?? 'Chi tiết truyện'}
        description="Thông tin truyện, mục lục, theo dõi, đọc tiếp (phần 2b)."
      />
    </>
  )
}
