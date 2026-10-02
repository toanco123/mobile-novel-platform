import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { CommentsSection } from '@/features/comments/components/CommentsSection'
import { useComments } from '@/features/comments/hooks'
import { useOnline } from '@/hooks/useOnline'

/** Như ChapterComments của web (chế độ từng chương): bình luận của chương, cần có mạng */
export function ChapterComments({ slug, chapter }: { slug: string; chapter: number }) {
  const { data } = useComments(slug, chapter)
  const total = data?.pages[0]?.total
  const online = useOnline()
  if (!online) {
    return (
      <Text className="text-sm text-muted-foreground">
        {`Cần có mạng để xem và gửi bình luận chương ${chapter}.`}
      </Text>
    )
  }

  return (
    <View aria-label={`Bình luận chương ${chapter}`}>
      <View className="mb-5 flex-row items-baseline gap-2">
        <Text role="heading" className="font-heading-bold text-3xl">
          {`Bình luận chương ${chapter}`}
        </Text>
        {total !== undefined && <Text className="text-muted-foreground">{`(${total})`}</Text>}
      </View>
      <CommentsSection slug={slug} chapter={chapter} />
    </View>
  )
}
