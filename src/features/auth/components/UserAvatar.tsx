import { Image } from 'expo-image'
import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import type { User } from '@/types/user'
import { initials } from '../initials'

/** Ảnh đại diện tròn; chưa có ảnh thì chữ cái đầu trên nền đỏ rượu (như web) */
export function UserAvatar({
  user,
  size = 40,
  className,
}: {
  user: Pick<User, 'displayName' | 'avatarUrl'>
  size?: number
  className?: string
}) {
  return (
    <View
      aria-hidden
      style={{ width: size, height: size }}
      className={cn('items-center justify-center overflow-hidden rounded-full bg-wine', className)}
    >
      {user.avatarUrl ? (
        <Image source={user.avatarUrl} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Text className="font-sans-semibold text-[#f4e7ed]" style={{ fontSize: size * 0.38 }}>
          {initials(user.displayName)}
        </Text>
      )}
    </View>
  )
}
