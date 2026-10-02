import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

/** Danh sách chọn một (radio) dạng các ô viền, như nhóm radio có viền của web */
export function ChoiceList<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <View role="radiogroup" aria-label={label} className="gap-1.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <Pressable
            key={o.value}
            role="radio"
            aria-checked={active}
            onPress={() => onChange(o.value)}
            className={cn(
              'flex-row items-center gap-3 rounded-lg border px-3.5 py-2.5',
              active ? 'border-primary bg-primary/5' : 'border-border active:bg-muted/60',
            )}
          >
            <View
              className={cn(
                'size-4 items-center justify-center rounded-full border',
                active ? 'border-primary' : 'border-muted-foreground',
              )}
            >
              {active && <View className="size-2 rounded-full bg-primary" />}
            </View>
            <Text className="text-sm">{o.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
