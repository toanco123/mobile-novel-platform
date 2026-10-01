import { Link } from 'expo-router'
import { History } from 'lucide-react-native'
import { FlatList, Pressable, View } from 'react-native'
import { SectionHeading } from '@/components/common/SectionHeading'
import { Text } from '@/components/ui/text'
import { StoryCover } from '@/features/stories/StoryCover'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'
import { useReadingHistory } from '../hooks'
import { ProgressMeter } from './ProgressMeter'

/** Trang chủ: các truyện đang đọc dở, cả của khách (ẩn khi chưa đọc gì), như web */
export function ContinueReading() {
  const { data } = useReadingHistory(4)
  const colors = useThemeColors()
  if (!data?.length) return null

  return (
    <View className="mt-10">
      <SectionHeading icon={<History size={24} color={colors.roseGold} />}>Đọc tiếp</SectionHeading>
      <FlatList
        horizontal
        data={data}
        keyExtractor={(item) => item.story.slug}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-3 px-4"
        renderItem={({ item: { story, progress } }) => (
          <Link href={links.chapter(story.slug, progress.chapter, progress.progress)} asChild>
            <Pressable className="w-72 flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:opacity-80">
              <StoryCover story={story} width={48} compact className="rounded" />
              <View className="flex-1">
                <Text numberOfLines={1} className="font-sans-medium">
                  {story.title}
                </Text>
                <Text numberOfLines={1} className="text-xs text-muted-foreground">
                  Chương {progress.chapter}
                  {progress.chapterTitle && `: ${progress.chapterTitle}`}
                </Text>
                <ProgressMeter value={progress.progress} className="mt-2" />
              </View>
            </Pressable>
          </Link>
        )}
      />
    </View>
  )
}
