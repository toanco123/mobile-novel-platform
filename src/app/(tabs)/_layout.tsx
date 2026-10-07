import { router, Tabs } from 'expo-router'
import { BookMarked, Compass, House, Search, UserRound } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { FloatingTabBar } from '@/components/common/FloatingTabBar'
import { OfflineBannerLayout } from '@/components/common/OfflineBanner'
import { SiteLogo } from '@/components/common/SiteLogo'
import { useLibraryUpdateCount } from '@/features/library/hooks'
import { CheckInHeaderButton } from '@/features/rewards/components/CheckInHeaderButton'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'

/** Bốn tab chính thay cho header + menu của web */
export default function TabsLayout() {
  const colors = useThemeColors()
  const { data: updates = 0 } = useLibraryUpdateCount()
  return (
    <Tabs
      // Mất mạng thì có dải báo ngay trên thanh tab, ở mọi tab
      screenLayout={({ children }) => <OfflineBannerLayout>{children}</OfflineBannerLayout>}
      // Thanh tab dạng viên nổi có chuyển động (lấy title, tabBarIcon, tabBarBadge của từng tab)
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 24 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          // Header trang chủ là logo như web
          headerTitle: () => <SiteLogo />,
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
          // Nút điểm danh (khi đã đăng nhập) và nút tìm kiếm như header của web
          headerRight: () => (
            <View className="mr-4 flex-row items-center gap-1">
              <CheckInHeaderButton />
              <Pressable
                role="button"
                aria-label="Tìm truyện"
                hitSlop={8}
                onPress={() => router.push(links.search())}
                className="size-10 items-center justify-center rounded-full active:bg-muted"
              >
                <Search size={22} color={colors.foreground} />
              </Pressable>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Tủ truyện',
          // Số truyện đang theo dõi có chương mới (như nhãn neon của web)
          tabBarBadge: updates > 0 ? updates : undefined,
          tabBarIcon: ({ color, size }) => <BookMarked color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
