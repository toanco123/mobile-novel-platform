import { useEffect, useRef } from 'react'
import { type LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

export type SectionNavItem<T extends string> = { id: T; label: string; count?: number }

type Props<T extends string> = {
  items: SectionNavItem<T>[]
  active: T
  onSelect: (id: T) => void
  onLayout?: (e: LayoutChangeEvent) => void
}

/**
 * Như SectionNav của web: thanh mục lục dính dưới header (màn đặt nó ở stickyHeaderIndices), tô
 * sáng mục đang xem; thanh cuộn ngang tự kéo mục đang xem vào vùng nhìn thấy
 */
export function SectionNav<T extends string>({ items, active, onSelect, onLayout }: Props<T>) {
  const list = useRef<ScrollView>(null)
  const positions = useRef(new Map<T, number>())

  useEffect(() => {
    const x = positions.current.get(active)
    if (x !== undefined) list.current?.scrollTo({ x: Math.max(0, x - 16), animated: true })
  }, [active])

  return (
    <View
      role="navigation"
      aria-label="Mục lục trang"
      onLayout={onLayout}
      className="border-b border-border bg-background"
    >
      <ScrollView
        ref={list}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-1 px-3 py-2"
      >
        {items.map((item) => {
          const current = item.id === active
          return (
            <Pressable
              key={item.id}
              role="link"
              aria-selected={current}
              onLayout={(e) => positions.current.set(item.id, e.nativeEvent.layout.x)}
              onPress={() => onSelect(item.id)}
              className={cn(
                'h-9 flex-row items-center gap-1.5 rounded-full px-4',
                current ? 'border border-primary/30 bg-primary/10' : 'active:bg-muted',
              )}
            >
              <Text
                className={cn(
                  'font-sans-medium text-sm',
                  current ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </Text>
              {item.count !== undefined && (
                <Text
                  className={cn(
                    'text-xs opacity-70',
                    current ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {String(item.count)}
                </Text>
              )}
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}
