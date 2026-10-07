import { router } from 'expo-router'
import { ArrowRight, BookOpen, Share2 } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { FollowButton } from '@/features/library/components/FollowButton'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'
import { paths } from '@/lib/routes'
import { shareLink } from '@/lib/share'
import type { ChapterContent } from '@/types/chapter'
import { goToChapter } from '../navigation'

/**
 * Như ChapterEnd của web: mời đọc chương kế, hoặc báo đã đọc tới chương mới nhất. Thêm nút chia sẻ
 * chương (riêng của app: thanh công cụ đọc không còn chỗ)
 */
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

      <Button
        variant="ghost"
        icon={<Share2 size={16} color={colors.mutedForeground} />}
        onPress={() =>
          shareLink({
            title: `${story.title} - ${chapter.title ? `Chương ${chapter.number}: ${chapter.title}` : `Chương ${chapter.number}`}`,
            path: paths.chapter(story.slug, chapter.number),
          })
        }
        className="mt-4 h-10 rounded-full px-4"
        textClassName="text-sm text-muted-foreground"
      >
        Chia sẻ chương
      </Button>
    </View>
  )
}
