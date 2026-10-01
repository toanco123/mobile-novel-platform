import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native'
import { cn } from '@/lib/utils'
import { Text } from './text'

const variants = {
  default: {
    box: 'bg-primary',
    text: 'text-primary-foreground',
    spinner: 'accent-primary-foreground',
  },
  outline: {
    box: 'border border-border bg-card',
    text: 'text-foreground',
    spinner: 'accent-foreground',
  },
  ghost: { box: '', text: 'text-foreground', spinner: 'accent-foreground' },
  // Chữ màu nền: đủ tương phản trên đỏ của cả hai theme
  destructive: { box: 'bg-destructive', text: 'text-background', spinner: 'accent-background' },
} as const

type Props = Omit<PressableProps, 'children'> & {
  variant?: keyof typeof variants
  /** Đang gửi: khóa nút, hiện vòng quay và pendingLabel (nếu có) */
  pending?: boolean
  pendingLabel?: string
  icon?: ReactNode
  className?: string
  textClassName?: string
  children: string
}

export function Button({
  variant = 'default',
  pending = false,
  pendingLabel,
  icon,
  className,
  textClassName,
  disabled,
  children,
  ...props
}: Props) {
  const style = variants[variant]
  const locked = !!disabled || pending
  return (
    <Pressable
      role="button"
      aria-disabled={locked}
      aria-busy={pending}
      disabled={locked}
      className={cn(
        'h-12 flex-row items-center justify-center gap-2 rounded-lg px-4 active:opacity-80',
        style.box,
        locked && 'opacity-60',
        className,
      )}
      {...props}
    >
      {pending ? <ActivityIndicator size="small" colorClassName={style.spinner} /> : icon}
      <Text className={cn('font-sans-semibold text-[15px]', style.text, textClassName)}>
        {pending && pendingLabel ? pendingLabel : children}
      </Text>
    </Pressable>
  )
}
