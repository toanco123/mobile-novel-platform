import { router } from 'expo-router'
import { ArrowRight, BookOpen } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { FollowButton } from '@/features/library/components/FollowButton'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'
import type { ChapterContent } from '@/types/chapter'
import { goToChapter } from '../navigation'

/** Như ChapterEnd của web: mời đọc chương kế, hoặc báo đã đọc tới chương mới nhất */
export function ChapterEnd({ chapter }: { chapter: ChapterContent }) {
  const { story, next } = chapter
  const colors = useThemeColors()
  const completed = story.status === 'completed'

  return (
    <View aria-label="Hết chương" className="items-center">
      <Text className="text-sm text-muted-foreground">Hết chương {chapter.number}</Text>

      {next ? (
        <Pressable
          role="link"
          onPress={() => goToChapter(story.slug, next.number)}
          className="mt-6 w-full items-center rounded-2xl border border-border bg-card px-6 py-7 active:opacity-80"
        >
          <Text className="text-sm text-muted-foreground">Đọc tiếp chương {next.number}</Text>
          <View className="mt-1 flex-row items-center justify-center gap-2">
            <Text className="shrink text-center font-heading-bold text-2xl leading-tight">
              {next.title || `Chương ${next.number}`}
            </Text>
            <ArrowRight size={20} color={colors.primary} />
          </View>
        </Pressable>
      ) : (
        <View className="mt-6 w-full items-center rounded-2xl border border-dashed border-border px-6 py-7">
          <Text className="text-center font-heading-bold text-2xl leading-tight">
            {completed ? 'Bạn đã đọc hết truyện' : 'Bạn đã đọc tới chương mới nhất'}
          </Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            {completed
              ? `Cảm ơn bạn đã đồng hành cùng ${story.title}. Hãy để lại đánh giá cho tác giả nhé.`
              : 'Theo dõi truyện để thấy ngay trong tủ truyện khi có chương mới.'}
          </Text>
          <View className="mt-5 w-full gap-3">
            {!completed && <FollowButton slug={story.slug} />}
            <Button
              variant="outline"
              icon={<BookOpen size={17} color={colors.foreground} />}
              onPress={() => router.push(links.story(story.slug))}
              className="h-11 rounded-full px-5"
              textClassName="text-sm"
            >
              Về trang truyện
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}
