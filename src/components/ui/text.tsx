import { Text as RNText, type TextProps } from 'react-native'
import { cn } from '@/lib/utils'

/** Chữ có sẵn font và màu của theme: React Native không kế thừa font, màu từ View cha */
export function Text({ className, ...props }: TextProps) {
  return <RNText className={cn('font-sans text-base text-foreground', className)} {...props} />
}
