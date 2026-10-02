import { router, Tabs } from 'expo-router'
import { BookMarked, Compass, House, Search, UserRound } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { SITE_NAME } from '@/config/site'
import { useLibraryUpdateCount } from '@/features/library/hooks'
import { useThemeColors } from '@/hooks/useThemeColors'
import { links } from '@/lib/links'

/** Bốn tab chính thay cho header + menu của web */
export default function TabsLayout() {
  const colors = useThemeColors()
  const { data: updates = 0 } = useLibraryUpdateCount()
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 24 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: 'BeVietnamPro_500Medium', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          // Header trang chủ là logo: tên web bằng font chữ ký, màu neon như web
          headerTitle: SITE_NAME,
          headerTitleStyle: {
            fontFamily: 'GreatVibes_400Regular',
            fontSize: 30,
            color: colors.neon,
          },
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
          // Nút tìm kiếm như ô tìm ở header của web
          headerRight: () => (
            <Pressable
              role="button"
              aria-label="Tìm truyện"
              hitSlop={8}
              onPress={() => router.push(links.search())}
              className="mr-4 size-10 items-center justify-center rounded-full active:bg-muted"
            >
              <Search size={22} color={colors.foreground} />
            </Pressable>
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
          tabBarBadgeStyle: {
            backgroundColor: colors.neon,
            fontFamily: 'BeVietnamPro_600SemiBold',
          },
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
