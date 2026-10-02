import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { RefreshControl, ScrollView } from 'react-native'
import { ContinueReading } from '@/features/library/components/ContinueReading'
import { EditorPicks } from '@/features/stories/sections/EditorPicks'
import { GenreCloud } from '@/features/stories/sections/GenreCloud'
import { HeroShowcase } from '@/features/stories/sections/HeroShowcase'
import { LatestUpdates } from '@/features/stories/sections/LatestUpdates'
import { NewReleases } from '@/features/stories/sections/NewReleases'
import { TrendingWeekly } from '@/features/stories/sections/TrendingWeekly'
import { useThemeColors } from '@/hooks/useThemeColors'

/** Trang chủ (HomePage của web, một cột) */
export default function HomeScreen() {
  const queryClient = useQueryClient()
  const colors = useThemeColors()
  const [refreshing, setRefreshing] = useState(false)

  async function refresh() {
    setRefreshing(true)
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['stories'], type: 'active' }),
      queryClient.refetchQueries({ queryKey: ['library'], type: 'active' }),
      queryClient.refetchQueries({ queryKey: ['genres'], type: 'active' }),
    ])
    setRefreshing(false)
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-12"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      <HeroShowcase />
      <ContinueReading />
      <EditorPicks />
      <LatestUpdates />
      <NewReleases />
      <TrendingWeekly />
      <GenreCloud />
    </ScrollView>
  )
}
