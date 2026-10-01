import type { Ref } from 'react'
import { TextInput, type TextInputProps } from 'react-native'
import { cn } from '@/lib/utils'

type Props = TextInputProps & {
  ref?: Ref<TextInput>
  /** Ô đang có lỗi: viền đỏ */
  invalid?: boolean
}

export function Input({ className, invalid, editable = true, ...props }: Props) {
  return (
    <TextInput
      editable={editable}
      placeholderTextColorClassName="accent-muted-foreground"
      selectionColorClassName="accent-primary"
      cursorColorClassName="accent-primary"
      // text-[16px]: chỉ cỡ chữ, không đặt line-height (iOS lệch chữ trong ô nhập khi có line-height)
      className={cn(
        'h-12 rounded-lg border border-input bg-card px-3.5 font-sans text-[16px] text-foreground',
        invalid && 'border-destructive',
        !editable && 'text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}
