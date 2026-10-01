import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, RefreshControl, View } from 'react-native'
import { SegmentedTabs } from '@/components/common/SegmentedTabs'
import { Text } from '@/components/ui/text'
import { TextLink } from '@/components/ui/text-link'
import { useSession } from '@/features/auth/hooks'
import { FollowingList } from '@/features/library/components/FollowingList'
import { HistoryList } from '@/features/library/components/HistoryList'
import { LibraryEmpty } from '@/features/library/components/LibraryStates'
import { useLibraryUpdateCount } from '@/features/library/hooks'
import { useThemeColors } from '@/hooks/useThemeColors'

type Tab = 'following' | 'history'

/** Tủ truyện (LibraryPage của web): Đang theo dõi, Lịch sử đọc; tab Đã lưu thêm ở 3c */
export default function LibraryScreen() {
  const { data: user, isPending } = useSession()
  const { data: updates = 0 } = useLibraryUpdateCount()
  const queryClient = useQueryClient()
  const colors = useThemeColors()
  // null: chưa chọn, dùng mặc định như web (khách xem lịch sử, đã đăng nhập xem truyện theo dõi)
  const [picked, setPicked] = useState<Tab | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator colorClassName="accent-primary" />
      </View>
    )
  }

  const tab: Tab = picked ?? (user ? 'following' : 'history')

  async function refresh() {
    setRefreshing(true)
    await queryClient.refetchQueries({ queryKey: ['library'], type: 'active' })
    setRefreshing(false)
  }
  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
  )

  const header = (
    <View className="gap-4 pt-4 pb-5">
      <SegmentedTabs
        label="Mục trong tủ truyện"
        value={tab}
        onChange={setPicked}
        items={[
          {
            value: 'following',
            label: 'Đang theo dõi',
            extra:
              updates > 0 ? (
                <View
                  aria-label={`${updates} truyện có chương mới`}
                  className="min-w-4 items-center rounded-full bg-neon px-1.5"
                >
                  <Text className="font-sans-semibold text-[11px] leading-4 text-background">
                    {String(updates)}
                  </Text>
                </View>
              ) : null,
          },
          { value: 'history', label: 'Lịch sử đọc' },
        ]}
      />
      {tab === 'history' && !user && (
        <View className="rounded-xl border border-dashed border-border p-4">
          <Text className="text-sm text-muted-foreground">
            Lịch sử đang lưu trên máy này.{' '}
            <TextLink onPress={() => router.push('/login')} className="text-sm">
              Đăng nhập
            </TextLink>{' '}
            để giữ lịch sử trong tài khoản.
          </Text>
        </View>
      )}
    </View>
  )

  if (tab === 'history') {
    return (
      <View className="flex-1 bg-background">
        <HistoryList header={header} refreshControl={refreshControl} />
      </View>
    )
  }
  if (user) {
    return (
      <View className="flex-1 bg-background">
        <FollowingList header={header} refreshControl={refreshControl} />
      </View>
    )
  }
  return (
    <View className="flex-1 bg-background px-4">
      {header}
      <LibraryEmpty
        title="Đăng nhập để theo dõi truyện"
        description="Theo dõi truyện để biết ngay khi có chương mới, trên mọi thiết bị."
        action="Đăng nhập"
        onAction={() => router.push('/login')}
      />
    </View>
  )
}
