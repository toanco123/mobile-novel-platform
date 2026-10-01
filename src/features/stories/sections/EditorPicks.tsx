import { Flame } from 'lucide-react-native'
import { FlatList, useWindowDimensions, View } from 'react-native'
import { SECTION_ERROR, SectionHeading, SectionNote } from '@/components/common/SectionHeading'
import { useThemeColors } from '@/hooks/useThemeColors'
import { useEditorPicks } from '../hooks'
import { StoryCard, StoryCardSkeleton } from '../StoryCard'

/** Truyện đề cử: hàng cuộn ngang (như web) */
export function EditorPicks() {
  const { data, isPending, isError } = useEditorPicks()
  const { width } = useWindowDimensions()
  const colors = useThemeColors()
  const cardWidth = Math.round(Math.min(width * 0.36, 180))
  // Chỉ rỗng khi chưa có truyện công khai nào: ẩn cả khối như truyện nổi bật
  if (data?.length === 0) return null

  return (
    <View className="mt-10">
      <SectionHeading icon={<Flame size={24} color={colors.neon} />}>Truyện đề cử</SectionHeading>
      {isError ? (
        <SectionNote>{SECTION_ERROR}</SectionNote>
      ) : (
        <FlatList
          horizontal
          data={isPending ? undefined : data}
          keyExtractor={(s) => s.slug}
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + 16}
          decelerationRate="fast"
          contentContainerClassName="gap-4 px-4"
          renderItem={({ item }) => <StoryCard story={item} width={cardWidth} />}
          ListEmptyComponent={
            <View className="flex-row gap-4">
              {[0, 1, 2].map((i) => (
                <StoryCardSkeleton key={i} width={cardWidth} />
              ))}
            </View>
          }
        />
      )}
    </View>
  )
}
