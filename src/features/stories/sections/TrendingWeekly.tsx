import { Link } from 'expo-router'
import { Trophy } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { SECTION_ERROR, SectionHeading, SectionNote } from '@/components/common/SectionHeading'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { formatCount } from '@/lib/format'
import { links } from '@/lib/links'
import { cn } from '@/lib/utils'
import { useTrendingWeekly } from '../hooks'
import { StoryCover } from '../StoryCover'

// Như web: hạng 1 neon, hạng 2–3 vàng hồng
const rankColor = ['text-neon', 'text-rose-gold', 'text-rose-gold/80']

export function TrendingWeekly() {
  const { data, isPending, isError } = useTrendingWeekly()
  const colors = useThemeColors()

  return (
    <View className="mt-10">
      <SectionHeading icon={<Trophy size={22} color={colors.roseGold} />}>Top tuần</SectionHeading>
      {isError ? (
        <SectionNote>{SECTION_ERROR}</SectionNote>
      ) : data?.length === 0 ? (
        <SectionNote>Tuần này chưa có lượt đọc nào.</SectionNote>
      ) : (
        <View className="gap-1 px-2">
          {isPending
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="mx-2 h-16 rounded-lg" />)
            : data.map(({ story: s, value }, i) => (
                <Link key={s.slug} href={links.story(s.slug)} asChild>
                  <Pressable className="flex-row items-center gap-3 rounded-lg p-2 active:bg-muted">
                    <Text
                      className={cn(
                        'w-8 text-center font-heading-bold text-[32px] leading-none',
                        rankColor[i] ?? 'text-muted-foreground',
                      )}
                      // Cormorant mặc định dùng số kiểu cổ (1 giống chữ I): ép số thẳng như lining-nums của web
                      style={{ fontVariant: ['lining-nums', 'tabular-nums'] }}
                    >
                      {i + 1}
                    </Text>
                    <StoryCover story={s} width={40} compact className="rounded" />
                    <View className="flex-1">
                      <Text numberOfLines={1} className="font-sans-medium text-sm">
                        {s.title}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {formatCount(value)} lượt đọc tuần này
                      </Text>
                    </View>
                  </Pressable>
                </Link>
              ))}
        </View>
      )}
    </View>
  )
}
