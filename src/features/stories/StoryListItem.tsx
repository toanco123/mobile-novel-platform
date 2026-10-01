import { Link } from 'expo-router'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { formatCount } from '@/lib/format'
import { links } from '@/lib/links'
import type { Story } from '@/types/story'
import { StoryCover } from './StoryCover'

/** Một dòng truyện gọn: bìa nhỏ, tên, lượt đọc (danh sách ngắn), như StoryListItem của web */
export function StoryListItem({ story }: { story: Story }) {
  return (
    <Link href={links.story(story.slug)} asChild>
      <Pressable className="flex-row items-center gap-3 rounded-lg p-2 active:bg-muted">
        <StoryCover story={story} width={40} compact className="rounded" />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-sans-medium text-sm">
            {story.title}
          </Text>
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {[story.genres[0]?.name, `${formatCount(story.viewCount)} lượt đọc`]
              .filter(Boolean)
              .join(', ')}
          </Text>
        </View>
      </Pressable>
    </Link>
  )
}
