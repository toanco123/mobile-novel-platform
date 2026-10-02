import { Link, router, useLocalSearchParams } from 'expo-router'
import { Trophy } from 'lucide-react-native'
import { FlatList, Pressable, View } from 'react-native'
import { SECTION_ERROR } from '@/components/common/SectionHeading'
import { SegmentedTabs } from '@/components/common/SegmentedTabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import type { RankedStory, RankingCriterion, RankingPeriod } from '@/features/stories/api'
import { useRanking } from '@/features/stories/hooks'
import { StoryCover } from '@/features/stories/StoryCover'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCount } from '@/lib/format'
import { links } from '@/lib/links'
import { cn } from '@/lib/utils'

// Như RankingPage của web (cùng tham số ?by=, ?period=)
const criteria: { value: RankingCriterion; param: string; label: string; hint: string }[] = [
  {
    value: 'views',
    param: 'views',
    label: 'Đọc nhiều',
    hint: 'Xếp theo lượt đọc chương trong kỳ.',
  },
  {
    value: 'rating',
    param: 'rating',
    label: 'Điểm cao',
    hint: 'Xếp theo điểm, có tính cả số lượt chấm để truyện ít lượt chấm không lên đầu.',
  },
  {
    value: 'follows',
    param: 'follows',
    label: 'Theo dõi nhiều',
    hint: 'Xếp theo số người thêm truyện vào tủ.',
  },
]

const periods: { value: RankingPeriod; param: string; label: string }[] = [
  { value: 'week', param: 'week', label: 'Tuần' },
  { value: 'month', param: 'month', label: 'Tháng' },
  { value: 'all', param: 'all', label: 'Mọi lúc' },
]

const rankColor = ['text-neon', 'text-rose-gold', 'text-rose-gold/80']

export default function RankingScreen() {
  const params = useLocalSearchParams<{ by?: string; period?: string }>()
  const criterion = criteria.find((c) => c.param === params.by) ?? criteria[0]
  const period = periods.find((p) => p.param === params.period) ?? periods[0]
  const { data, isPending, isError, isPlaceholderData } = useRanking(criterion.value, period.value)
  const refreshControl = usePullToRefresh([['stories']])
  const colors = useThemeColors()

  // Giá trị mặc định không ghi lên params (như query string gọn của web)
  const choose = (by: string, next: string) =>
    router.setParams({
      by: by === criteria[0].param ? undefined : by,
      period: next === periods[0].param ? undefined : next,
    })

  return (
    <FlatList
      data={isPending ? [] : (data ?? [])}
      keyExtractor={(item) => item.story.slug}
      refreshControl={refreshControl}
      className={cn('flex-1 bg-background', isPlaceholderData && 'opacity-60')}
      aria-busy={isPending || isPlaceholderData}
      contentContainerClassName="px-4 pb-12"
      ListHeaderComponent={
        <View className="gap-4 pt-2 pb-5">
          <View>
            <View className="flex-row items-center gap-3">
              <Trophy size={30} color={colors.roseGold} />
              <Text role="heading" className="font-heading-bold text-4xl leading-tight">
                Bảng xếp hạng
              </Text>
            </View>
            <Text className="mt-1 text-muted-foreground">{criterion.hint}</Text>
          </View>
          <SegmentedTabs
            label="Tiêu chí xếp hạng"
            value={criterion.param}
            onChange={(by) => choose(by, period.param)}
            items={criteria.map((c) => ({ value: c.param, label: c.label }))}
          />
          {criterion.value === 'views' && (
            <SegmentedTabs
              label="Kỳ xếp hạng"
              value={period.param}
              onChange={(next) => choose(criterion.param, next)}
              items={periods.map((p) => ({ value: p.param, label: p.label }))}
              className="self-start"
            />
          )}
        </View>
      }
      ListEmptyComponent={
        isError ? (
          <Text className="text-sm text-muted-foreground">{SECTION_ERROR}</Text>
        ) : isPending ? (
          <View className="gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </View>
        ) : (
          <View className="rounded-xl border border-dashed border-border p-8">
            <Text className="text-center text-muted-foreground">
              Chưa có số liệu cho bảng xếp hạng này.
            </Text>
          </View>
        )
      }
      renderItem={({ item, index }) => (
        <RankingRow item={item} rank={index + 1} criterion={criterion.value} />
      )}
    />
  )
}

function RankingRow({
  item: { story, value },
  rank,
  criterion,
}: {
  item: RankedStory
  rank: number
  criterion: RankingCriterion
}) {
  const metric =
    criterion === 'rating'
      ? { value: `${value.toFixed(1)} ★`, unit: `${formatCount(story.ratingCount)} lượt chấm` }
      : { value: formatCount(value), unit: criterion === 'views' ? 'lượt đọc' : 'theo dõi' }

  return (
    <Link href={links.story(story.slug)} asChild>
      <Pressable
        className={cn(
          'flex-row items-center gap-3 rounded-lg p-3 active:bg-muted',
          rank <= 3 && 'bg-primary/[0.03]',
        )}
      >
        <Text
          className={cn(
            'w-9 text-center font-heading-bold text-[30px] leading-none',
            rankColor[rank - 1] ?? 'text-muted-foreground',
          )}
          // Cormorant mặc định dùng số kiểu cổ: ép số thẳng như lining-nums của web
          style={{ fontVariant: ['lining-nums', 'tabular-nums'] }}
        >
          {String(rank)}
        </Text>
        <StoryCover story={story} width={48} compact className="rounded" />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-sans-medium">
            {story.title}
          </Text>
          <Text numberOfLines={1} className="text-sm text-muted-foreground">
            {story.author.name}
            {story.genres[0] && (
              <Text className="text-sm text-rose-gold">{` · ${story.genres[0].name}`}</Text>
            )}
          </Text>
          <Text className="mt-0.5 text-sm">
            <Text className="font-sans-medium text-sm">{metric.value}</Text>
            <Text className="text-sm text-muted-foreground">{` ${metric.unit}`}</Text>
          </Text>
        </View>
      </Pressable>
    </Link>
  )
}
