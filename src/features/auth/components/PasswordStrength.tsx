import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { passwordStrength } from '../schemas'

// Như web (PasswordStrength.tsx)
const levels = {
  1: { label: 'Yếu', color: 'bg-destructive', text: 'text-destructive' },
  2: { label: 'Tạm được', color: 'bg-rose-gold', text: 'text-rose-gold' },
  3: { label: 'Mạnh', color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
} as const

export function PasswordStrength({ password }: { password: string }) {
  const score = passwordStrength(password)
  if (score === 0) {
    return <Text className="text-xs text-muted-foreground">Ít nhất 8 ký tự, gồm cả chữ và số.</Text>
  }
  const level = levels[score]
  return (
    <View className="flex-row items-center gap-3" accessibilityLiveRegion="polite">
      <View className="flex-1 flex-row gap-1" aria-hidden>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            className={cn('h-1 flex-1 rounded-full', i <= score ? level.color : 'bg-muted')}
          />
        ))}
      </View>
      <Text className={cn('font-sans-medium text-xs', level.text)}>Độ mạnh: {level.label}</Text>
    </View>
  )
}
