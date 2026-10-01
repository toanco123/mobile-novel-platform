import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { pageList } from '@/lib/pagination'
import { cn } from '@/lib/utils'

type Props = {
  page: number
  pageCount: number
  onChange: (page: number) => void
  /** Nhãn cho vùng điều hướng, vd "Phân trang danh sách chương" */
  label: string
  className?: string
}

const item = 'h-9 min-w-9 items-center justify-center rounded-full px-3'

/** Như Pagination của web (nút thay link); ẩn khi chỉ có 1 trang */
export function Pagination({ page, pageCount, onChange, label, className }: Props) {
  const colors = useThemeColors()
  if (pageCount <= 1) return null

  const arrow = (target: number, enabled: boolean, icon: ReactNode, ariaLabel: string) => (
    <Pressable
      role="button"
      aria-label={ariaLabel}
      aria-disabled={!enabled}
      disabled={!enabled}
      onPress={() => onChange(target)}
      className={cn(item, enabled ? 'active:bg-muted' : 'opacity-40')}
    >
      {icon}
    </Pressable>
  )

  return (
    <View
      role="navigation"
      aria-label={label}
      className={cn('mt-6 flex-row flex-wrap items-center justify-center gap-1', className)}
    >
      {arrow(
        page - 1,
        page > 1,
        <ChevronLeft size={16} color={colors.mutedForeground} />,
        'Trang trước',
      )}
      {pageList(page, pageCount).map((p, i) =>
        p === '…' ? (
          <View key={`gap-${i}`} aria-hidden className={item}>
            <Text className="text-sm text-muted-foreground">…</Text>
          </View>
        ) : (
          <Pressable
            key={p}
            role="button"
            aria-label={`Trang ${p}`}
            aria-selected={p === page}
            onPress={() => p !== page && onChange(p)}
            className={cn(item, p === page ? 'bg-primary' : 'active:bg-muted')}
          >
            <Text
              className={cn(
                'text-sm',
                p === page ? 'font-sans-semibold text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              {String(p)}
            </Text>
          </Pressable>
        ),
      )}
      {arrow(
        page + 1,
        page < pageCount,
        <ChevronRight size={16} color={colors.mutedForeground} />,
        'Trang sau',
      )}
    </View>
  )
}
