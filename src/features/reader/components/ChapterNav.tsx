import { ChevronLeft, ChevronRight, ListOrdered } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { cn } from '@/lib/utils'
import type { ChapterContent, ChapterNeighbor } from '@/types/chapter'
import { goToChapter } from '../navigation'

type Props = {
  chapter: ChapterContent
  onOpenIndex: () => void
  label: string
  /** Tô nổi nút "Chương sau"; tắt khi bên dưới đã có thẻ "Đọc tiếp" làm nút chính */
  emphasizeNext?: boolean
}

/** Như ChapterNav của web: chương trước · mục lục · chương sau (đầu và cuối chương) */
export function ChapterNav({ chapter, onOpenIndex, label, emphasizeNext = true }: Props) {
  const { story, prev, next } = chapter
  const colors = useThemeColors()

  return (
    <View role="navigation" aria-label={label} className="flex-row items-center gap-2">
      <NavButton slug={story.slug} target={prev} direction="prev" emphasize={false} />
      <Pressable
        role="button"
        aria-label={`Mục lục, đang ở chương ${chapter.number} trên ${story.chapterCount}`}
        onPress={onOpenIndex}
        className="h-10 flex-row items-center gap-1.5 rounded-full px-3 active:bg-muted"
      >
        <ListOrdered size={16} color={colors.mutedForeground} />
        <Text className="text-sm text-muted-foreground">
          {`${chapter.number}/${story.chapterCount}`}
        </Text>
      </Pressable>
      <NavButton slug={story.slug} target={next} direction="next" emphasize={emphasizeNext} />
    </View>
  )
}

function NavButton({
  slug,
  target,
  direction,
  emphasize,
}: {
  slug: string
  target: ChapterNeighbor | null
  direction: 'prev' | 'next'
  emphasize: boolean
}) {
  const colors = useThemeColors()
  const tint = emphasize ? colors.primaryForeground : colors.foreground
  const label = direction === 'prev' ? 'Chương trước' : 'Chương sau'
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight

  return (
    <Pressable
      role="button"
      aria-label={target ? `${label}: chương ${target.number}` : label}
      aria-disabled={!target}
      disabled={!target}
      onPress={() => target && goToChapter(slug, target.number)}
      className={cn(
        'h-10 flex-1 flex-row items-center justify-center gap-1 rounded-full active:opacity-80',
        direction === 'next' && 'flex-row-reverse',
        emphasize ? 'bg-primary' : 'border border-border bg-card',
        !target && 'opacity-40',
      )}
    >
      <Icon size={17} color={tint} />
      <Text
        className={cn(
          'font-sans-medium text-sm',
          emphasize ? 'text-primary-foreground' : 'text-foreground',
        )}
      >
        {label}
      </Text>
    </Pressable>
  )
}
