import Constants from 'expo-constants'
import { router } from 'expo-router'
import {
  Ban,
  ChevronRight,
  FileText,
  Info,
  KeyRound,
  LogOut,
  Mail,
  Moon,
  PenLine,
  Shield,
  UserRound,
  UserRoundX,
} from 'lucide-react-native'
import { Pressable, ScrollView, Switch, View } from 'react-native'
import { toast } from 'sonner-native'
import { MenuGroup, MenuRow } from '@/components/common/Menu'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { SITE_NAME } from '@/config/site'
import { UserAvatar } from '@/features/auth/components/UserAvatar'
import { authErrorMessage, useSession, useSignOut } from '@/features/auth/hooks'
import { openWebPage } from '@/features/auth/navigation'
import { useTheme } from '@/hooks/useTheme'
import { useThemeColors } from '@/hooks/useThemeColors'
import { paths } from '@/lib/routes'
import type { User } from '@/types/user'

export default function AccountScreen() {
  const { data: user, isPending } = useSession()
  const { theme, toggleTheme } = useTheme()

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-4 pt-2 pb-10">
      {isPending ? (
        <View className="h-24 rounded-xl bg-card" />
      ) : user ? (
        <ProfileCard user={user} />
      ) : (
        <GuestCard />
      )}

      {user && (
        <MenuGroup title="Tài khoản">
          <MenuRow icon={UserRound} label="Hồ sơ" onPress={() => router.push('/account/profile')} />
          {user.provider === 'email' && (
            <MenuRow
              icon={KeyRound}
              label="Đổi mật khẩu"
              onPress={() => router.push('/account/password')}
            />
          )}
          <MenuRow
            icon={Ban}
            label="Người đã chặn"
            onPress={() => router.push('/account/blocked')}
          />
          <MenuRow
            icon={PenLine}
            label="Viết truyện (trên web)"
            external
            onPress={() => openWebPage(paths.studio)}
          />
        </MenuGroup>
      )}

      <MenuGroup title="Cài đặt">
        <MenuRow
          icon={Moon}
          label="Giao diện tối"
          onPress={toggleTheme}
          right={
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              aria-label="Giao diện tối"
              trackColorOnClassName="accent-primary"
            />
          }
        />
      </MenuGroup>

      <MenuGroup title="Thông tin">
        <MenuRow icon={Info} label="Giới thiệu" external onPress={() => openWebPage(paths.about)} />
        <MenuRow icon={Mail} label="Liên hệ" onPress={() => router.push('/contact')} />
        <MenuRow
          icon={FileText}
          label="Điều khoản sử dụng"
          external
          onPress={() => openWebPage(paths.terms)}
        />
        <MenuRow
          icon={Shield}
          label="Chính sách bảo mật"
          external
          onPress={() => openWebPage(paths.privacy)}
        />
      </MenuGroup>

      {user && <SignedInActions />}

      <Text className="text-center text-xs text-muted-foreground">
        {SITE_NAME} · phiên bản {Constants.expoConfig?.version}
      </Text>
    </ScrollView>
  )
}

function GuestCard() {
  return (
    <View className="gap-4 rounded-xl border border-border bg-card p-5">
      <View className="gap-1.5">
        <Text role="heading" className="font-heading-bold text-2xl">
          Bạn đang đọc với tư cách khách
        </Text>
        <Text className="text-sm text-muted-foreground">
          Đăng nhập để lưu truyện vào tủ, đọc tiếp đúng chỗ trên cả điện thoại và web, và bình luận
          cùng mọi người.
        </Text>
      </View>
      <View className="gap-2.5">
        <Button onPress={() => router.push('/login')}>Đăng nhập</Button>
        <Button variant="outline" onPress={() => router.push('/register')}>
          Tạo tài khoản
        </Button>
      </View>
    </View>
  )
}

function ProfileCard({ user }: { user: User }) {
  const colors = useThemeColors()
  return (
    <Pressable
      role="button"
      aria-label={`Hồ sơ của ${user.displayName}`}
      onPress={() => router.push('/account/profile')}
      className="flex-row items-center gap-4 rounded-xl border border-border bg-card p-4 active:bg-muted"
    >
      <UserAvatar user={user} size={56} />
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-sans-semibold text-lg">
          {user.displayName}
        </Text>
        <Text numberOfLines={1} className="text-sm text-muted-foreground">
          {user.email}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  )
}

function SignedInActions() {
  const signOut = useSignOut()
  return (
    <MenuGroup>
      <MenuRow
        icon={LogOut}
        label={signOut.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
        right={<View />}
        onPress={() =>
          signOut.mutate(undefined, {
            onSuccess: () => toast.success('Đã đăng xuất'),
            onError: (error) => toast.error(authErrorMessage(error)),
          })
        }
      />
      <MenuRow
        icon={UserRoundX}
        label="Xóa tài khoản"
        destructive
        onPress={() => router.push('/account/delete')}
      />
    </MenuGroup>
  )
}
