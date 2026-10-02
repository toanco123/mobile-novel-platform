import type { ReactNode } from 'react'
import { Pressable } from 'react-native'
import { cn } from '@/lib/utils'

/** Nút tròn trên thanh nổi: `primary` là nút chính (phát / tạm dừng) */
export function BarButton({
  label,
  onPress,
  disabled,
  primary,
  children,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  primary?: boolean
  children: ReactNode
}) {
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'size-11 items-center justify-center rounded-full',
        primary ? 'bg-primary active:opacity-80' : 'active:bg-muted',
        disabled && 'opacity-40',
      )}
    >
      {children}
    </Pressable>
  )
}
