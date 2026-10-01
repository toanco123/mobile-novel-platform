import { Tabs } from 'expo-router'
import { BookMarked, Compass, House, UserRound } from 'lucide-react-native'
import { SITE_NAME } from '@/config/site'
import { useThemeColors } from '@/hooks/useThemeColors'

/** Bốn tab chính thay cho header + menu của web */
export default function TabsLayout() {
  const colors = useThemeColors()
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
