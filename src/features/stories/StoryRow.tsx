import { Link } from 'expo-router'
import { BookOpen, Eye, Star } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCount } from '@/lib/format'
import { links } from '@/lib/links'
import type { Story } from '@/types/story'
import { StoryCover } from './StoryCover'

/** Như StoryRow của web: một dòng truyện đầy đủ (kết quả tìm kiếm) */
export function StoryRow({ story }: { story: Story }) {
  const colors = useThemeColors()
  return (
    <Link href={links.story(story.slug)} asChild>
      <Pressable className="flex-row gap-4 py-4 active:opacity-70">
        <View className="overflow-hidden rounded-md border border-border">
          <StoryCover story={story} width={72} />
        </View>
        <View className="flex-1">
          <Text numberOfLines={2} className="font-heading-bold text-xl leading-tight">
            {story.title}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 text-sm text-muted-foreground">
            {story.author.name}
            {story.genres.length > 0 && (
              <Text className="text-sm text-rose-gold">
                {` · ${story.genres
                  .slice(0, 3)
                  .map((g) => g.name)
                  .join(', ')}`}
              </Text>
            )}
          </Text>
          {story.description ? (
            <Text numberOfLines={2} className="mt-1.5 text-sm text-foreground/80">
              {story.description}
            </Text>
          ) : null}
          <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
            <Stat icon={<BookOpen size={13} color={colors.mutedForeground} />}>
              {`${story.chapterCount} chương, ${story.status === 'completed' ? 'hoàn thành' : 'đang ra'}`}
            </Stat>
            <Stat icon={<Eye size={13} color={colors.mutedForeground} />}>
              {formatCount(story.viewCount)}
            </Stat>
            {story.ratingCount > 0 && (
              <Stat icon={<Star size={13} color={colors.roseGold} fill={colors.roseGold} />}>
                {story.ratingAvg.toFixed(1)}
              </Stat>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  )
}

function Stat({ icon, children }: { icon: React.ReactNode; children: string }) {
  return (
    <View className="flex-row items-center gap-1">
      {icon}
      <Text className="text-xs text-muted-foreground">{children}</Text>
    </View>
  )
}

export function StoryRowSkeleton() {
  return (
    <View className="flex-row gap-4 py-4">
      <Skeleton className="h-[108px] w-[72px] rounded-md" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
      </View>
    </View>
  )
}
