import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react-native'
import { ActivityIndicator, Pressable } from 'react-native'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { rateLabel } from '../readerOptions'
import { speech, useSpeechPlayer } from '../speech/speechPlayer'
import { SPEECH_RATES, useSpeechSettings } from '../speech/useSpeechSettings'
import { BarButton } from './BarButton'
import { FloatingBar } from './FloatingBar'

/** Như SpeechBar của web: thanh điều khiển nghe truyện, nổi ở đáy khi đang nghe hoặc tạm dừng */
export function SpeechBar() {
  const state = useSpeechPlayer()
  const rate = useSpeechSettings((s) => s.rate)
  const colors = useThemeColors()
  const playing = state.status === 'playing'
  const preparing = playing && state.total === 0
  const rates: readonly number[] = SPEECH_RATES
  const nextRate = rates[(rates.indexOf(rate) + 1) % rates.length]

  return (
    <FloatingBar label="Nghe truyện">
      <BarButton
        label="Đoạn trước"
        disabled={state.paragraph === 0 || preparing}
        onPress={() => speech.skip(-1)}
      >
        <SkipBack size={18} color={colors.foreground} />
      </BarButton>
      <BarButton
        primary
        label={playing ? 'Tạm dừng' : 'Nghe tiếp'}
        onPress={playing ? speech.pause : speech.resume}
      >
        {preparing ? (
          <ActivityIndicator colorClassName="accent-primary-foreground" />
        ) : playing ? (
          <Pause size={18} color={colors.primaryForeground} fill={colors.primaryForeground} />
        ) : (
          <Play size={18} color={colors.primaryForeground} fill={colors.primaryForeground} />
        )}
      </BarButton>
      <BarButton
        label="Đoạn sau"
        disabled={preparing || state.paragraph >= state.total - 1}
        onPress={() => speech.skip(1)}
      >
        <SkipForward size={18} color={colors.foreground} />
      </BarButton>
      <Text numberOfLines={1} className="flex-1 px-1 text-xs text-muted-foreground">
        <Text className="font-sans-medium text-xs text-foreground">{`Chương ${state.chapter}`}</Text>
        {state.total > 0 && ` · ${state.paragraph + 1}/${state.total}`}
        {!playing && ' · đã dừng'}
      </Text>
      <Pressable
        role="button"
        aria-label={`Tốc độ đọc ${rateLabel(rate)}, bấm để đổi sang ${rateLabel(nextRate)}`}
        onPress={() => speech.setRate(nextRate)}
        className="h-10 min-w-12 items-center justify-center rounded-full px-2 active:bg-muted"
      >
        <Text className="text-sm">{rateLabel(rate)}</Text>
      </Pressable>
      <BarButton label="Tắt nghe truyện" onPress={speech.stop}>
        <X size={18} color={colors.mutedForeground} />
      </BarButton>
    </FloatingBar>
  )
}
