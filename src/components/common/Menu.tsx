import { ChevronRight, ExternalLink, type LucideIcon } from 'lucide-react-native'
import { Children, Fragment, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { cn } from '@/lib/utils'

/** Nhóm mục kiểu trang cài đặt: tiêu đề nhỏ + khung bo góc, các mục cách nhau bằng vạch mảnh */
export function MenuGroup({ title, children }: { title?: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(Boolean)
  return (
    <View className="gap-2">
      {title && (
        <Text className="px-1 font-sans-semibold text-xs tracking-wider text-muted-foreground uppercase">
          {title}
        </Text>
      )}
      <View className="overflow-hidden rounded-xl border border-border bg-card">
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <View className="ml-12 h-px bg-border" />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  )
}

export function MenuRow({
  icon: Icon,
  label,
  onPress,
  external = false,
  destructive = false,
  right,
}: {
  icon: LucideIcon
  label: string
  onPress: () => void
  /** Mở trang web bên ngoài app: icon mũi tên ra ngoài thay cho dấu ">" */
  external?: boolean
  destructive?: boolean
  /** Thay phần bên phải (vd công tắc) */
  right?: ReactNode
}) {
  const colors = useThemeColors()
  const Trailing = external ? ExternalLink : ChevronRight
  return (
    <Pressable
      role={external ? 'link' : 'button'}
      onPress={onPress}
      className="min-h-13 flex-row items-center gap-3 px-4 py-3 active:bg-muted"
    >
      <Icon size={20} color={destructive ? colors.destructive : colors.mutedForeground} />
      <Text className={cn('flex-1', destructive && 'text-destructive')}>{label}</Text>
      {right ?? <Trailing size={external ? 16 : 18} color={colors.mutedForeground} />}
    </Pressable>
  )
}
