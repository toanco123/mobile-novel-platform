import { useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useRef, useState } from 'react'
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native'
import { PlaceholderScreen } from '@/components/common/PlaceholderScreen'
import { SectionHeading } from '@/components/common/SectionHeading'
import { ShareButton } from '@/components/common/ShareButton'
import { Button } from '@/components/ui/button'
import { ChapterList } from '@/features/chapters/components/ChapterList'
import { CommentsSection } from '@/features/comments/components/CommentsSection'
import { useComments } from '@/features/comments/hooks'
import { useStoryProgress } from '@/features/library/hooks'
import { SectionNav } from '@/features/stories/detail/SectionNav'
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
import { paths } from '@/lib/routes'
import type { ChapterOrder } from '@/types/chapter'
import type { Story } from '@/types/story'

const SECTIONS = ['about', 'chapters', 'comments'] as const
type Section = (typeof SECTIONS)[number]

/** Chi tiết truyện (StoryDetailPage của web) */
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
  const [refreshing, setRefreshing] = useState(false)
  const comments = useComments(story.slug)
  // Vị trí đầu từng mục trong ScrollView (onLayout) và chiều cao thanh mục lục dính
  const sectionY = useRef<Record<Section, number>>({ about: 0, chapters: 0, comments: 0 })
  const navHeight = useRef(0)
  const [active, setActive] = useState<Section>('about')

  const scrollToSection = (id: Section, animated = true) =>
    scroll.current?.scrollTo({ y: Math.max(0, sectionY.current[id] - navHeight.current), animated })

  // Mục đang xem: mục cuối cùng đã cuộn qua mép dưới thanh mục lục (như useActiveSection của web)
  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const top = e.nativeEvent.contentOffset.y + navHeight.current + 8
    const next = SECTIONS.filter((id) => sectionY.current[id] <= top).at(-1) ?? 'about'
    if (next !== active) setActive(next)
  }
  const sectionLayout = (id: Section) => (e: LayoutChangeEvent) => {
    sectionY.current[id] = e.nativeEvent.layout.y
  }

  function changeChapters(nextPage: number, nextOrder: ChapterOrder) {
    router.setParams({
      page: nextPage > 1 ? String(nextPage) : undefined,
      sort: nextOrder === 'desc' ? 'newest' : undefined,
    })
    // Đổi trang thì về đầu danh sách chương (như web); đổi thứ tự thì giữ nguyên chỗ
    if (nextPage !== page) scrollToSection('chapters')
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
        ['comments', story.slug],
        ['rating', story.slug],
      ].map((queryKey) => queryClient.refetchQueries({ queryKey, type: 'active' })),
    )
    setRefreshing(false)
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: story.title,
          headerRight: () => (
            <ShareButton
              label="Chia sẻ truyện"
              title={story.title}
              path={paths.story(story.slug)}
            />
          ),
        }}
      />
      <ScrollView
        ref={scroll}
        className="flex-1 bg-background"
        contentContainerClassName="pb-12"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // Bàn phím không che ô viết bình luận
        automaticallyAdjustKeyboardInsets
        // Thanh mục lục (con thứ 2) dính dưới header khi cuộn, như web
        stickyHeaderIndices={[1]}
        onScroll={onScroll}
        scrollEventThrottle={64}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <StoryHero story={story} />
        <SectionNav
          active={active}
          onSelect={(id) => scrollToSection(id)}
          onLayout={(e) => {
            navHeight.current = e.nativeEvent.layout.height
          }}
          items={[
            { id: 'about', label: 'Giới thiệu' },
            { id: 'chapters', label: 'Danh sách chương', count: story.chapterCount },
            { id: 'comments', label: 'Bình luận', count: comments.data?.pages[0]?.total },
          ]}
        />

        <View className="mt-10" onLayout={sectionLayout('about')}>
          <SectionHeading>Giới thiệu</SectionHeading>
          <StoryDescription story={story} />
        </View>

        <View className="mt-12" onLayout={sectionLayout('chapters')}>
          <SectionHeading>Danh sách chương</SectionHeading>
          <ChapterList
            story={story}
            page={page}
            order={order}
            onChange={changeChapters}
            readingChapter={progress?.chapter}
          />
        </View>

        <View className="mt-12" onLayout={sectionLayout('comments')}>
          <SectionHeading>Bình luận & đánh giá</SectionHeading>
          <View className="px-4">
            <CommentsSection slug={story.slug} />
          </View>
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
