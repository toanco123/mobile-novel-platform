import type { TextProps } from 'react-native'
import { cn } from '@/lib/utils'
import { Text } from './text'

/** Chữ bấm được màu vàng hồng (link của web); lồng được trong Text khác */
export function TextLink({ className, ...props }: TextProps) {
  return (
    <Text
      role="link"
      suppressHighlighting={false}
      className={cn('font-sans-medium text-sm text-rose-gold active:opacity-70', className)}
      {...props}
    />
  )
}
