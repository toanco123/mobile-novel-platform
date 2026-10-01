import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

type Item<T extends string> = {
  value: T
  label: string
  /** Phần thêm sau nhãn (vd số đếm) */
  extra?: ReactNode
}

/** Thanh chọn mục chia đều chiều ngang (SegmentedLinks của web) */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: Item<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <View
      role="tablist"
      aria-label={label}
      className={cn('flex-row rounded-full border border-border p-1', className)}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <Pressable
            key={item.value}
            role="tab"
            aria-selected={active}
            onPress={() => !active && onChange(item.value)}
            className={cn(
              'h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-full px-2',
              active && 'bg-secondary',
            )}
          >
            <Text
              numberOfLines={1}
              className={cn(
                'text-sm',
                active ? 'font-sans-medium text-secondary-foreground' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </Text>
            {item.extra}
          </Pressable>
        )
      })}
    </View>
  )
}
