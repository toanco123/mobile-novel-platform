import { Link } from 'expo-router'
import { BookOpen, Eye } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCount } from '@/lib/format'
import { links } from '@/lib/links'
import type { Story } from '@/types/story'
import { StoryCover } from './StoryCover'

/** Thẻ truyện: bìa, nhãn Full, tên, lượt xem, số chương (như StoryCard của web) */
export function StoryCard({ story, width }: { story: Story; width: number }) {
  const colors = useThemeColors()
  return (
    <Link href={links.story(story.slug)} asChild>
      <Pressable style={{ width }} className="active:opacity-80">
        <View className="overflow-hidden rounded-lg border border-border">
          <StoryCover story={story} width={width - 2} />
          {story.status === 'completed' && (
            <View className="absolute top-2 left-2 rounded-sm bg-rose-gold px-1.5 py-0.5">
              <Text className="font-sans-semibold text-[10px] leading-tight text-background">
                Full
              </Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} className="mt-2 font-sans-medium text-sm leading-snug">
          {story.title}
        </Text>
        <View className="mt-1 flex-row flex-wrap items-center gap-x-3">
          <View className="flex-row items-center gap-1">
            <Eye size={13} color={colors.mutedForeground} />
            <Text
              aria-label={`${formatCount(story.viewCount)} lượt xem`}
              className="text-xs text-muted-foreground"
            >
              {formatCount(story.viewCount)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <BookOpen size={13} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">{story.chapterCount} chương</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  )
}

export function StoryCardSkeleton({ width }: { width: number }) {
  return (
    <View style={{ width }}>
      <Skeleton style={{ width, height: width * 1.5 }} className="rounded-lg" />
      <Skeleton className="mt-2.5 h-4 w-4/5" />
      <Skeleton className="mt-1.5 h-3 w-1/2" />
    </View>
  )
}
