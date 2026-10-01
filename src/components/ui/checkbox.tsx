import { Check } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { useThemeColors } from '@/hooks/useThemeColors'
import { cn } from '@/lib/utils'

type Props = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** Tên đọc cho trình đọc màn hình (nhãn hiển thị nằm ngoài ô) */
  label: string
  invalid?: boolean
  className?: string
}

export function Checkbox({ checked, onCheckedChange, label, invalid, className }: Props) {
  const colors = useThemeColors()
  return (
    <Pressable
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      hitSlop={10}
      onPress={() => onCheckedChange(!checked)}
      className={cn(
        'size-5 items-center justify-center rounded-[5px] border-2',
        checked ? 'border-primary bg-primary' : invalid ? 'border-destructive' : 'border-input',
        className,
      )}
    >
      {checked && <Check size={13} strokeWidth={3.5} color={colors.primaryForeground} />}
    </Pressable>
  )
}
