import { View } from 'react-native'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import type { Story } from '@/types/story'
import { StoryListItem } from '../StoryListItem'

type Props = {
  title: string
  stories: Story[] | undefined
  isPending: boolean
}

/** Như SideStoryList của web (cột phụ, ở app nằm cuối trang); ẩn hẳn khi không có truyện nào */
export function SideStoryList({ title, stories, isPending }: Props) {
  if (!isPending && !stories?.length) return null
  return (
    <View>
      <Text role="heading" className="mb-3 px-4 font-heading-bold text-2xl">
        {title}
      </Text>
      <View className="gap-1 px-2">
        {isPending
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="mx-2 h-16 rounded-lg" />)
          : stories!.map((s) => <StoryListItem key={s.slug} story={s} />)}
      </View>
    </View>
  )
}
