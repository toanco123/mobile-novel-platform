import { Link, router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { BookOpen, Eye, Star } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { GenreLinks } from '@/features/genres/GenreLinks'
import { FollowButton } from '@/features/library/components/FollowButton'
import { formatCount } from '@/lib/format'
import { links } from '@/lib/links'
import { cn } from '@/lib/utils'
import type { Story } from '@/types/story'
import { coverPalette } from '../coverPalette'
import { HERO } from '../heroColors'
import { useFeaturedStories } from '../hooks'
import { StoryCover } from '../StoryCover'

const SLIDE_MS = 7000
const { ink: INK, gold: GOLD, neon: NEON } = HERO

/**
 * Truyện nổi bật (HeroShowcase của web): vuốt ngang từng trang, tự chuyển sau 7 giây; dừng khi
 * người dùng đang vuốt hoặc bật Giảm chuyển động.
 */
export function HeroShowcase() {
  const { data: stories, isPending, isError } = useFeaturedStories()
  const { width } = useWindowDimensions()
  const list = useRef<FlatList<Story>>(null)
  const [index, setIndex] = useState(0)
  const [dragging, setDragging] = useState(false)
  const reducedMotion = useReducedMotion()
  const count = stories?.length ?? 0
  // Danh sách tải lại có thể ít đi khi đang ở trang cuối: kẹp về trang cuối mới
  const current = Math.min(index, Math.max(0, count - 1))

  useEffect(() => {
    if (count < 2 || dragging || reducedMotion) return
    const timer = setTimeout(() => {
      list.current?.scrollToIndex({ index: (current + 1) % count, animated: true })
    }, SLIDE_MS)
    return () => clearTimeout(timer)
  }, [count, current, dragging, reducedMotion])

  if (isPending) return <HeroSkeleton />
  if (isError || !stories.length) return null

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setDragging(false)
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
  }

  return (
    <View aria-label="Truyện nổi bật">
      <FlatList
        ref={list}
        horizontal
        pagingEnabled
        data={stories}
        keyExtractor={(s) => s.slug}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScrollBeginDrag={() => setDragging(true)}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => <Slide story={item} width={width} />}
      />
      {count > 1 && (
        <View
          role="tablist"
          aria-label="Chọn truyện nổi bật"
          className="absolute inset-x-0 bottom-4 flex-row justify-center gap-1.5"
        >
          {stories.map((s, i) => (
            <Pressable
              key={s.slug}
              role="tab"
              aria-selected={i === current}
              aria-label={s.title}
              hitSlop={8}
              onPress={() => list.current?.scrollToIndex({ index: i, animated: true })}
              className={cn('h-1.5 rounded-full', i === current ? 'w-6' : 'w-1.5')}
              style={{ backgroundColor: i === current ? NEON : `${INK}4d` }}
            />
          ))}
        </View>
      )}
    </View>
  )
}

function Slide({ story, width }: { story: Story; width: number }) {
  const p = coverPalette(story.slug)
  const first = story.firstChapterNumber ?? 1
  return (
    <View style={{ width }} className="overflow-hidden px-5 pt-6 pb-12">
      <LinearGradient
        colors={[p.to, p.from, p.to]}
        locations={[0.1, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Quầng sáng hồng neon góc phải như web */}
      <LinearGradient
        colors={['transparent', `${NEON}33`]}
        start={{ x: 0.3, y: 0.2 }}
        end={{ x: 1, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      <View className="flex-row items-center gap-4">
        <Link href={links.story(story.slug)} asChild>
          <Pressable
            aria-hidden
            className="overflow-hidden rounded-lg"
            style={{ transform: [{ rotate: '-3deg' }] }}
          >
            <StoryCover story={story} width={104} />
          </Pressable>
        </Link>
        <View className="flex-1 gap-1.5">
          {story.genres.length > 0 && (
            <Text numberOfLines={1} className="text-xs" style={{ color: GOLD }}>
              <GenreLinks genres={story.genres} />
            </Text>
          )}
          <Link href={links.story(story.slug)} asChild>
            <Text
              role="link"
              numberOfLines={3}
              className="font-heading-bold text-[30px] leading-[32px]"
              style={{ color: INK }}
            >
              {story.title}
            </Text>
          </Link>
          <Text numberOfLines={1} className="text-sm" style={{ color: `${INK}cc` }}>
            của{' '}
            <Text className="font-heading-italic text-lg" style={{ color: INK }}>
              {story.author.name}
            </Text>
          </Text>
        </View>
      </View>

      {story.description ? (
        <Text
          numberOfLines={3}
          className="mt-4 text-sm leading-relaxed"
          style={{ color: `${INK}bf` }}
        >
          {story.description}
        </Text>
      ) : null}

      <View className="mt-3 flex-row flex-wrap gap-x-5 gap-y-1">
        <Stat icon={<Star size={15} color={GOLD} fill={GOLD} />}>
          {`${story.ratingAvg.toFixed(1)} (${formatCount(story.ratingCount)})`}
        </Stat>
        <Stat icon={<Eye size={15} color={`${INK}cc`} />}>{formatCount(story.viewCount)}</Stat>
        <Stat icon={<BookOpen size={15} color={`${INK}cc`} />}>
          {`${story.chapterCount} chương, ${story.status === 'completed' ? 'đã hoàn thành' : 'đang ra'}`}
        </Stat>
      </View>

      <View className="mt-5 flex-row flex-wrap gap-2.5">
        <Button
          icon={<BookOpen size={17} color={HERO.base} />}
          onPress={() => router.push(links.chapter(story.slug, first))}
          className="h-11 rounded-full px-5"
          style={{ backgroundColor: NEON }}
          textClassName="text-sm text-[#1a0f1d]"
        >
          {`Đọc từ chương ${first}`}
        </Button>
        <FollowButton slug={story.slug} onDark />
      </View>
    </View>
  )
}

function Stat({ icon, children }: { icon: React.ReactNode; children: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text className="text-sm" style={{ color: `${INK}cc` }}>
        {children}
      </Text>
    </View>
  )
}

function HeroSkeleton() {
  return (
    <View className="gap-4 border-b border-border bg-muted/40 px-5 pt-6 pb-12">
      <View className="flex-row items-center gap-4">
        <Skeleton className="h-[156px] w-[104px] rounded-lg" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </View>
      </View>
      <Skeleton className="h-14 w-full" />
    </View>
  )
}
