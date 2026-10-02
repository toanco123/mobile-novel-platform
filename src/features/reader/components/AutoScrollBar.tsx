import { ChevronRight, Minus, Pause, Play, Plus, X } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import type { AutoScroll } from '../autoscroll/useAutoScroll'
import { AUTO_SCROLL_SPEEDS } from '../autoscroll/useAutoScrollSettings'
import { rateLabel } from '../readerOptions'
import { BarButton } from './BarButton'
import { FloatingBar } from './FloatingBar'

type Props = {
  autoScroll: AutoScroll
  /** Chương đang đọc */
  chapter: number
  /** Chương sau để cuộn tiếp khi hết chương; null khi không còn */
  next: number | null
  onNext: () => void
}

/** Như AutoScrollBar của web: thanh điều khiển tự động cuộn, nổi ở đáy màn hình */
export function AutoScrollBar({ autoScroll, chapter, next, onNext }: Props) {
  const { status, atEnd, speed } = autoScroll
  const running = status === 'running'
  const colors = useThemeColors()

  return (
    <FloatingBar label="Tự động cuộn">
      {atEnd ? (
        <>
          <Text role="status" numberOfLines={1} className="flex-1 px-3 text-sm">
            {next ? (
              <Text className="font-sans-medium text-sm">{`Hết chương ${chapter}`}</Text>
            ) : (
              'Đã tới chương mới nhất'
            )}
          </Text>
          {next !== null && (
            <Pressable
              role="button"
              onPress={onNext}
              className="h-10 flex-row items-center gap-1 rounded-full bg-primary px-4 active:opacity-80"
            >
              <Text className="font-sans-medium text-sm text-primary-foreground">Chương sau</Text>
              <ChevronRight size={16} color={colors.primaryForeground} />
            </Pressable>
          )}
        </>
      ) : (
        <>
          <BarButton
            primary
            label={running ? 'Tạm dừng' : 'Cuộn tiếp'}
            onPress={running ? autoScroll.pause : autoScroll.resume}
          >
            {running ? (
              <Pause size={18} color={colors.primaryForeground} fill={colors.primaryForeground} />
            ) : (
              <Play size={18} color={colors.primaryForeground} fill={colors.primaryForeground} />
            )}
          </BarButton>
          <Text numberOfLines={1} className="flex-1 px-1 font-sans-medium text-xs">
            {`Chương ${chapter}`}
          </Text>
          <BarButton
            label="Chậm hơn"
            disabled={speed <= AUTO_SCROLL_SPEEDS[0]}
            onPress={autoScroll.slower}
          >
            <Minus size={18} color={colors.foreground} />
          </BarButton>
          <View aria-live="polite" className="min-w-10 items-center">
            <Text aria-label={`Tốc độ ${rateLabel(speed)}`} className="text-sm">
              {rateLabel(speed)}
            </Text>
          </View>
          <BarButton
            label="Nhanh hơn"
            disabled={speed >= AUTO_SCROLL_SPEEDS[AUTO_SCROLL_SPEEDS.length - 1]}
            onPress={autoScroll.faster}
          >
            <Plus size={18} color={colors.foreground} />
          </BarButton>
        </>
      )}
      <BarButton label="Tắt tự động cuộn" onPress={autoScroll.stop}>
        <X size={18} color={colors.mutedForeground} />
      </BarButton>
    </FloatingBar>
  )
}
