import { Share2 } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { useThemeColors } from '@/hooks/useThemeColors'
import { shareLink } from '@/lib/share'

/** Nút chia sẻ hình tròn cho header: mở bảng chia sẻ của máy với link trang web (`path` từ `paths`) */
export function ShareButton({
  title,
  path,
  label,
}: {
  title: string
  path: string
  label: string
}) {
  const colors = useThemeColors()
  return (
    <Pressable
      role="button"
      aria-label={label}
      hitSlop={8}
      onPress={() => shareLink({ title, path })}
      className="size-10 items-center justify-center rounded-full active:bg-muted"
    >
      <Share2 size={21} color={colors.foreground} />
    </Pressable>
  )
}
