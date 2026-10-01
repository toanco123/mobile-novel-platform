import { useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useRef, useState } from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import { PlaceholderScreen } from '@/components/common/PlaceholderScreen'
import { SectionHeading } from '@/components/common/SectionHeading'
import { Button } from '@/components/ui/button'
import { ChapterList } from '@/features/chapters/components/ChapterList'
import { useStoryProgress } from '@/features/library/hooks'
import { SideStoryList } from '@/features/stories/detail/SideStoryList'
import { StoryDescription } from '@/features/stories/detail/StoryDescription'
import { StoryHero, StoryHeroSkeleton } from '@/features/stories/detail/StoryHero'
import {
  storyKeys,
  useRelatedStories,
  useStoriesByAuthor,
  useStory,
} from '@/features/stories/hooks'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { ChapterOrder } from '@/types/chapter'
import type { Story } from '@/types/story'

/** Chi tiết truyện (StoryDetailPage của web); Bình luận và thanh mục lục thêm ở bước 4 */
export default function StoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { data: story, isPending, isError, refetch, isRefetching } = useStory(slug)

  if (isPending) {
    return (
      <ScrollView className="flex-1 bg-background" scrollEnabled={false}>
        <StoryHeroSkeleton />
      </ScrollView>
    )
  }
  if (isError) {
    return (
      <PlaceholderScreen
        title="Không tải được truyện"
        description="Kiểm tra kết nối mạng rồi thử lại."
      >
        <Button pending={isRefetching} onPress={() => refetch()} className="mt-2 px-6">
          Thử lại
        </Button>
      </PlaceholderScreen>
    )
  }
  if (!story) {
    return (
      <PlaceholderScreen
        title="Không tìm thấy truyện"
        description="Có thể truyện đã bị gỡ hoặc đổi đường dẫn."
      >
        <Button variant="outline" onPress={() => router.dismissTo('/')} className="mt-2 px-6">
          Về trang chủ
        </Button>
      </PlaceholderScreen>
    )
  }
  return <StoryDetail key={story.slug} story={story} />
}

function StoryDetail({ story }: { story: Story }) {
  // Trang và thứ tự mục lục giữ trên params của route như query string của web (?page=2&sort=newest)
  const params = useLocalSearchParams<{ page?: string; sort?: string }>()
  const page = Math.max(1, Number(params.page) || 1)
  const order: ChapterOrder = params.sort === 'newest' ? 'desc' : 'asc'
  const byAuthor = useStoriesByAuthor(story.author.slug, story.slug)
  const related = useRelatedStories(story.slug)
  const { data: progress } = useStoryProgress(story.slug)
  const queryClient = useQueryClient()
  const colors = useThemeColors()
  const scroll = useRef<ScrollView>(null)
  const chaptersY = useRef(0)
  const [refreshing, setRefreshing] = useState(false)

  function changeChapters(nextPage: number, nextOrder: ChapterOrder) {
    router.setParams({
      page: nextPage > 1 ? String(nextPage) : undefined,
      sort: nextOrder === 'desc' ? 'newest' : undefined,
    })
    // Đổi trang thì về đầu danh sách chương (như web); đổi thứ tự thì giữ nguyên chỗ
    if (nextPage !== page) scroll.current?.scrollTo({ y: chaptersY.current, animated: true })
  }

  async function refresh() {
    setRefreshing(true)
    await Promise.all(
      [
        storyKeys.detail(story.slug),
        storyKeys.byAuthor(story.author.slug, story.slug),
        storyKeys.related(story.slug),
        ['chapters', story.slug],
        ['library'],
      ].map((queryKey) => queryClient.refetchQueries({ queryKey, type: 'active' })),
    )
    setRefreshing(false)
  }

  return (
    <>
      <Stack.Screen options={{ title: story.title }} />
      <ScrollView
        ref={scroll}
        className="flex-1 bg-background"
        contentContainerClassName="pb-12"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <StoryHero story={story} />

        <View className="mt-10">
          <SectionHeading>Giới thiệu</SectionHeading>
          <StoryDescription story={story} />
        </View>

        <View
          className="mt-12"
          onLayout={(e) => {
            chaptersY.current = e.nativeEvent.layout.y
          }}
        >
          <SectionHeading>Danh sách chương</SectionHeading>
          <ChapterList
            story={story}
            page={page}
            order={order}
            onChange={changeChapters}
            readingChapter={progress?.chapter}
          />
        </View>

        <View className="mt-12 gap-10">
          <SideStoryList
            title="Cùng tác giả"
            stories={byAuthor.data}
            isPending={byAuthor.isPending}
          />
          <SideStoryList
            title="Cùng thể loại"
            stories={related.data}
            isPending={related.isPending}
          />
        </View>
      </ScrollView>
    </>
  )
}
