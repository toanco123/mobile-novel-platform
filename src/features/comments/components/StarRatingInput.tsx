import { Star } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { Score } from '@/types/comment'

type Props = {
  value: Score | null
  onChange: (score: Score) => void
  disabled?: boolean
}

const scores: Score[] = [1, 2, 3, 4, 5]

/** Như StarRatingInput của web: 5 ngôi sao dạng radio, bấm để chấm */
export function StarRatingInput({ value, onChange, disabled }: Props) {
  const colors = useThemeColors()
  const shown = value ?? 0
  return (
    <View role="radiogroup" aria-label="Đánh giá của bạn" className="flex-row gap-1">
      {scores.map((s) => {
        const on = s <= shown
        return (
          <Pressable
            key={s}
            role="radio"
            aria-checked={value === s}
            aria-label={`${s} sao`}
            disabled={disabled}
            hitSlop={4}
            onPress={() => onChange(s)}
            className={
              disabled ? 'rounded-md p-0.5 opacity-50' : 'rounded-md p-0.5 active:opacity-60'
            }
          >
            <Star
              size={30}
              color={on ? colors.roseGold : colors.mutedForeground}
              fill={on ? colors.roseGold : 'transparent'}
              opacity={on ? 1 : 0.6}
            />
          </Pressable>
        )
      })}
    </View>
  )
}
