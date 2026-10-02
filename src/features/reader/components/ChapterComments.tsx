import { MessageCircle } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { CommentsSection } from '@/features/comments/components/CommentsSection'
import { useComments } from '@/features/comments/hooks'
import { useOnline } from '@/hooks/useOnline'
import { useThemeColors } from '@/hooks/useThemeColors'

type Props = {
  slug: string
  chapter: number
  /** Thu gọn sẵn, bấm mới mở (cuộn liên tục: tránh chèn dài giữa hai chương) */
  collapsible?: boolean
}

/** Như ChapterComments của web: bình luận của chương, cần có mạng */
export function ChapterComments({ slug, chapter, collapsible = false }: Props) {
  const [open, setOpen] = useState(!collapsible)
  const { data } = useComments(slug, chapter)
  const total = data?.pages[0]?.total
  const online = useOnline()
  const colors = useThemeColors()
  if (!online) {
    return (
      <Text className="text-sm text-muted-foreground">
        {`Cần có mạng để xem và gửi bình luận chương ${chapter}.`}
      </Text>
    )
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        aria-expanded={false}
        onPress={() => setOpen(true)}
        icon={<MessageCircle size={16} color={colors.foreground} />}
        className="h-9 self-center rounded-full px-4"
        textClassName="text-sm"
      >
        {`Bình luận chương ${chapter}${total !== undefined ? ` (${total})` : ''}`}
      </Button>
    )
  }

  return (
    <View aria-label={`Bình luận chương ${chapter}`} className="w-full">
      <View className="mb-5 flex-row items-baseline gap-2">
        <Text
          role="heading"
          className="font-heading-bold text-3xl"
          // Cormorant mặc định dùng số kiểu cổ: ép số thẳng như lining-nums của web
          style={{ fontVariant: ['lining-nums'] }}
        >
          {`Bình luận chương ${chapter}`}
        </Text>
        {total !== undefined && <Text className="text-muted-foreground">{`(${total})`}</Text>}
      </View>
      <CommentsSection slug={slug} chapter={chapter} />
    </View>
  )
}
