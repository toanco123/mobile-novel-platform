import { CircleAlert, CircleCheck } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { cn } from '@/lib/utils'

/** Lời báo đầu form: lỗi từ máy chủ hoặc báo thành công */
export function FormAlert({
  variant = 'error',
  children,
}: {
  variant?: 'error' | 'success'
  children: ReactNode
}) {
  const colors = useThemeColors()
  const error = variant === 'error'
  const Icon = error ? CircleAlert : CircleCheck
  return (
    <View
      role={error ? 'alert' : 'status'}
      accessibilityLiveRegion="polite"
      className={cn(
        'flex-row gap-2.5 rounded-lg border px-3.5 py-3',
        error
          ? 'border-destructive/40 bg-destructive/10'
          : 'border-emerald-500/40 bg-emerald-500/10',
      )}
    >
      <Icon size={16} color={error ? colors.destructive : '#10b981'} style={{ marginTop: 2 }} />
      <Text
        className={cn(
          'flex-1 text-sm',
          error ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-300',
        )}
      >
        {children}
      </Text>
    </View>
  )
}
