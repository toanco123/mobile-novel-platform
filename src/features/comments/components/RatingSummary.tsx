import { Star } from 'lucide-react-native'
import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatDecimal } from '@/lib/format'
import type { RatingSummary as Summary, Score } from '@/types/comment'

const scores: Score[] = [5, 4, 3, 2, 1]

/** Như RatingSummary của web: điểm trung bình, hàng sao, phân bố số sao */
export function RatingSummary({ summary }: { summary: Summary }) {
  const colors = useThemeColors()
  if (summary.count === 0) {
    return (
      <View>
        <Text className="font-heading-bold text-2xl">Chưa có đánh giá</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          Hãy là người đầu tiên chấm điểm truyện này.
        </Text>
      </View>
    )
  }
  const max = Math.max(1, ...scores.map((s) => summary.distribution[s]))
  return (
    <View className="flex-row items-center gap-6">
      <View className="items-center">
        <Text
          className="font-heading-bold text-6xl leading-none"
          style={{ fontVariant: ['lining-nums'] }}
        >
          {summary.average.toFixed(1)}
        </Text>
        <View aria-hidden className="mt-2 flex-row gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => {
            const on = i <= Math.round(summary.average)
            return (
              <Star
                key={i}
                size={16}
                color={on ? colors.roseGold : colors.mutedForeground}
                fill={on ? colors.roseGold : 'transparent'}
                opacity={on ? 1 : 0.5}
              />
            )
          })}
        </View>
        <Text className="mt-1 text-xs text-muted-foreground">
          {`${formatDecimal(summary.count)} lượt đánh giá`}
        </Text>
      </View>
      <View className="flex-1 gap-1.5">
        {scores.map((s) => {
          const count = summary.distribution[s]
          const percent = summary.count ? Math.round((count / summary.count) * 100) : 0
          return (
            <View
              key={s}
              aria-label={`${s} sao: ${percent}%`}
              className="flex-row items-center gap-2"
            >
              <View className="w-7 flex-row items-center gap-0.5">
                <Text className="text-xs text-muted-foreground">{String(s)}</Text>
                <Star size={11} color={colors.mutedForeground} fill={colors.mutedForeground} />
              </View>
              <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <View
                  className="h-full rounded-full bg-rose-gold"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </View>
              <Text className="w-9 text-right text-xs text-muted-foreground">{`${percent}%`}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
