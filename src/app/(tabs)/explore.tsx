import { type Href, Link } from 'expo-router'
import { BookCheck, Clock, Flame, Trophy } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { GenreGrid } from '@/features/genres/GenreGrid'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'

/** Tab Khám phá: lối vào bảng xếp hạng, danh sách truyện (menu đầu trang của web) và lưới thể loại */
export default function ExploreScreen() {
  const colors = useThemeColors()
  const refreshControl = usePullToRefresh([['genres']])
  const entries: { href: Href; label: string; icon: ReactNode }[] = [
    {
      href: links.ranking,
      label: 'Bảng xếp hạng',
      icon: <Trophy size={20} color={colors.roseGold} />,
    },
    {
      href: links.list('latest'),
      label: 'Mới cập nhật',
      icon: <Clock size={20} color={colors.roseGold} />,
    },
    {
      href: links.list('ongoing'),
      label: 'Đang ra',
      icon: <Flame size={20} color={colors.roseGold} />,
    },
    {
      href: links.list('completed'),
      label: 'Truyện full',
      icon: <BookCheck size={20} color={colors.roseGold} />,
    },
  ]

  return (
    <View className="flex-1 bg-background">
      <GenreGrid
        refreshControl={refreshControl}
        header={
          <View className="flex-row flex-wrap gap-3 pt-4 pb-4">
            {entries.map((e) => (
              <Link key={e.label} href={e.href} asChild>
                <Pressable className="h-14 grow basis-[45%] flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 active:opacity-80">
                  {e.icon}
                  <Text className="font-sans-medium">{e.label}</Text>
                </Pressable>
              </Link>
            ))}
          </View>
        }
      />
    </View>
  )
}
