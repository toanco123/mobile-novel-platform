import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { BookOpen, Clock, Eye, EyeOff, PenLine, Star } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { GenreLinks } from '@/features/genres/GenreLinks'
import { useSession } from '@/features/auth/hooks'
import { openWebPage } from '@/features/auth/navigation'
import { FollowButton } from '@/features/library/components/FollowButton'
import { DownloadButton } from '@/features/offline/components/DownloadButton'
import { useStoryProgress } from '@/features/library/hooks'
import { formatCount, formatRelativeTime } from '@/lib/format'
import { links } from '@/lib/links'
import { paths } from '@/lib/routes'
import type { Story } from '@/types/story'
import { coverPalette } from '../coverPalette'
import { HERO } from '../heroColors'
import { StoryCover } from '../StoryCover'

const onDarkOutline = 'h-11 rounded-full border-[#f4e7ed]/30 bg-transparent px-5'
const onDarkText = 'text-sm text-[#f4e7ed]'

/** Đầu trang truyện (StoryHero của web): nền tối chuyển màu theo bìa, thông tin, nút đọc */
export function StoryHero({ story }: { story: Story }) {
  const p = coverPalette(story.slug)
  const { data: viewer } = useSession()
  const isOwner = !!story.ownerId && story.ownerId === viewer?.id

  return (
    <View className="overflow-hidden">
      <LinearGradient
        colors={[p.to, p.from, p.to]}
        locations={[0.1, 0.6, 1]}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Quầng sáng hồng neon phía bìa như web */}
      <LinearGradient
        colors={[`${HERO.neon}2e`, 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.7, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {story.visibility === 'draft' && (
        <View
          className="flex-row items-center justify-center gap-2 px-4 py-2"
          style={{ backgroundColor: HERO.gold }}
        >
          <EyeOff size={16} color={HERO.base} />
          <Text className="flex-1 font-sans-medium text-sm" style={{ color: HERO.base }}>
            {/* Người khác thấy truyện chưa công khai chỉ có thể là quản trị viên xem truyện chờ duyệt */}
            {isOwner
              ? 'Truyện chưa công khai, chỉ bạn thấy trang này. Xuất bản hoặc gửi duyệt trong khu Sáng tác trên web để mọi người đọc được.'
              : 'Truyện đang chờ duyệt, chỉ tác giả và ban quản trị thấy trang này.'}
          </Text>
        </View>
      )}

      <View className="px-4 pt-5 pb-6">
        <View className="flex-row items-center gap-4">
          <View
            className="overflow-hidden rounded-lg border border-white/10"
            style={{
              boxShadow: [
                {
                  offsetX: 0,
                  offsetY: 18,
                  blurRadius: 40,
                  spreadDistance: -16,
                  color: 'rgba(0,0,0,0.7)',
                },
              ],
            }}
          >
            <StoryCover story={story} width={112} />
          </View>
          <View className="flex-1 gap-1.5">
            {story.genres.length > 0 && (
              <Text className="text-xs" style={{ color: HERO.gold }}>
                <GenreLinks genres={story.genres} />
              </Text>
            )}
            <Text
              role="heading"
              className="font-heading-bold text-[30px] leading-[32px]"
              style={{ color: HERO.ink }}
            >
              {story.title}
            </Text>
            <Text className="text-sm" style={{ color: `${HERO.ink}cc` }}>
              của{' '}
              <Text className="font-heading-italic text-lg" style={{ color: HERO.ink }}>
                {story.author.name}
              </Text>
            </Text>
          </View>
        </View>

        <View className="mt-5 flex-row flex-wrap gap-x-5 gap-y-2">
          <Stat icon={<Star size={15} color={HERO.gold} fill={HERO.gold} />}>
            {story.ratingCount > 0 ? (
              <>
                {story.ratingAvg.toFixed(1)}{' '}
                <Text className="text-sm" style={{ color: `${HERO.ink}8c` }}>
                  ({formatCount(story.ratingCount)})
                </Text>
              </>
            ) : (
              'Chưa có đánh giá'
            )}
          </Stat>
          <Stat icon={<Eye size={15} color={`${HERO.ink}d9`} />}>
            {formatCount(story.viewCount)}
          </Stat>
          <Stat icon={<BookOpen size={15} color={`${HERO.ink}d9`} />}>
            {`${story.chapterCount} chương, ${story.status === 'completed' ? 'đã hoàn thành' : 'đang ra'}`}
          </Stat>
          <Stat icon={<Clock size={15} color={`${HERO.ink}d9`} />}>
            {`Cập nhật ${formatRelativeTime(story.updatedAt)}`}
          </Stat>
        </View>

        <View className="mt-6 gap-3">
          <ReadButtons story={story} />
          {isOwner ? (
            <Button
              variant="outline"
              icon={<PenLine size={17} color={HERO.ink} />}
              onPress={() => openWebPage(paths.studioStory(story.id))}
              className={onDarkOutline}
              textClassName={onDarkText}
            >
              Quản lý truyện (trên web)
            </Button>
          ) : (
            <FollowButton slug={story.slug} onDark />
          )}
          <StoryDownloadButton story={story} />
        </View>
      </View>
    </View>
  )
}

function Stat({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text className="text-sm" style={{ color: `${HERO.ink}d9` }}>
        {children}
      </Text>
    </View>
  )
}

/** Đã đọc dở: "Đọc tiếp" là nút chính; chưa đọc: đọc từ chương đầu và chương mới nhất */
function ReadButtons({ story }: { story: Story }) {
  const { data: progress } = useStoryProgress(story.slug)
  const first = story.firstChapterNumber
  if (first === null) return null

  const primary = (label: string, href: ReturnType<typeof links.chapter>) => (
    <Button
      icon={<BookOpen size={17} color={HERO.base} />}
      onPress={() => router.push(href)}
      className="h-11 rounded-full px-6"
      style={{
        backgroundColor: HERO.neon,
        boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: 30, color: `${HERO.neon}66` }],
      }}
      textClassName="text-sm text-[#1a0f1d]"
    >
      {label}
    </Button>
  )
  const secondary = (label: string, href: ReturnType<typeof links.chapter>) => (
    <Button
      variant="outline"
      onPress={() => router.push(href)}
      className={onDarkOutline}
      textClassName={onDarkText}
    >
      {label}
    </Button>
  )

  if (progress) {
    return (
      <>
        {primary(
          `Đọc tiếp chương ${progress.chapter}`,
          links.chapter(story.slug, progress.chapter, progress.progress),
        )}
        {progress.chapter !== first && secondary('Đọc từ đầu', links.chapter(story.slug, first))}
      </>
    )
  }

  const latest = story.latestChapter?.number
  return (
    <>
      {primary(`Đọc từ chương ${first}`, links.chapter(story.slug, first))}
      {latest !== undefined &&
        latest !== first &&
        secondary(`Chương mới nhất (${latest})`, links.chapter(story.slug, latest))}
    </>
  )
}

export function StoryHeroSkeleton() {
  return (
    <View className="gap-5 bg-muted/40 px-4 pt-5 pb-6">
      <View className="flex-row items-center gap-4">
        <Skeleton className="h-[168px] w-[112px] rounded-lg" />
        <View className="flex-1 gap-2.5">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </View>
      </View>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-11 w-full rounded-full" />
      <Skeleton className="h-11 w-full rounded-full" />
    </View>
  )
}

/** Như web: tải từ chỗ đọc dở, chưa đọc thì từ chương đầu; truyện chưa công khai không lưu offline */
function StoryDownloadButton({ story }: { story: Story }) {
  const { data: progress } = useStoryProgress(story.slug)
  if (story.firstChapterNumber === null || story.visibility !== 'published') return null
  return (
    <DownloadButton
      slug={story.slug}
      title={story.title}
      from={progress?.chapter ?? story.firstChapterNumber}
      onDark
    />
  )
}
