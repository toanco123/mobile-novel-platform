import { router } from 'expo-router'
import { Bookmark, BookmarkCheck } from 'lucide-react-native'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/hooks'
import { useThemeColors } from '@/hooks/useThemeColors'
import { cn } from '@/lib/utils'
import { useFollowStatus, useToggleFollow } from '../hooks'

type Props = {
  slug: string
  /** Kiểu cho nền tối cố định (banner) */
  onDark?: boolean
  className?: string
}

/** Như FollowButton của web; khách bấm thì mở modal Đăng nhập (đóng lại là về đúng chỗ này) */
export function FollowButton({ slug, onDark = false, className }: Props) {
  const { data: user } = useSession()
  const { data: following = false, isPending } = useFollowStatus(slug)
  const toggle = useToggleFollow(slug)
  const colors = useThemeColors()

  const tint = following
    ? onDark
      ? '#d9a68f'
      : colors.roseGold
    : onDark
      ? '#f4e7ed'
      : colors.foreground
  const Icon = following ? BookmarkCheck : Bookmark

  return (
    <Button
      variant="outline"
      aria-pressed={!!user && following}
      disabled={!!user && isPending}
      onPress={() => (user ? toggle.mutate(!following) : router.push('/login'))}
      icon={<Icon size={17} color={tint} />}
      className={cn(
        'h-11 rounded-full px-5',
        onDark && 'border-[#f4e7ed]/30 bg-transparent',
        following && (onDark ? 'border-[#d9a68f]/60' : 'border-rose-gold/60'),
        className,
      )}
      textClassName={cn(
        'text-sm',
        onDark && 'text-[#f4e7ed]',
        following && (onDark ? 'text-[#d9a68f]' : 'text-rose-gold'),
      )}
    >
      {following ? 'Đã thêm vào tủ truyện' : 'Thêm vào tủ truyện'}
    </Button>
  )
}
