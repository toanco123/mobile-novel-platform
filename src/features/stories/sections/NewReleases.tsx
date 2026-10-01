import { useWindowDimensions, View } from 'react-native'
import { SECTION_ERROR, SectionHeading, SectionNote } from '@/components/common/SectionHeading'
import { useNewReleases } from '../hooks'
import { StoryCard, StoryCardSkeleton } from '../StoryCard'

const COLUMNS = 3
const GAP = 12
const PADDING = 16

/** Truyện mới ra: lưới 3 cột (như web ở màn nhỏ) */
export function NewReleases() {
  const { data, isPending, isError } = useNewReleases()
  const { width } = useWindowDimensions()
  const cardWidth = Math.floor((width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS)
  // Chỉ rỗng khi chưa có truyện công khai nào: khối "Mới cập nhật" đã báo
  if (data?.length === 0) return null

  return (
    <View className="mt-10">
      <SectionHeading>Truyện mới ra</SectionHeading>
      {isError ? (
        <SectionNote>{SECTION_ERROR}</SectionNote>
      ) : (
        <View className="flex-row flex-wrap px-4" style={{ columnGap: GAP, rowGap: 20 }}>
          {isPending
            ? [0, 1, 2].map((i) => <StoryCardSkeleton key={i} width={cardWidth} />)
            : data.map((s) => <StoryCard key={s.slug} story={s} width={cardWidth} />)}
        </View>
      )}
    </View>
  )
}
