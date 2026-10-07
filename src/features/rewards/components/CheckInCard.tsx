import { CalendarCheck, Check, Flame, Ticket } from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { toast } from 'sonner-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'
import { cn } from '@/lib/utils'
import { CHECKIN_CYCLE, type CheckInResult, cycleProgress, rewardErrorMessage } from '../api'
import { useCheckIn, useRewardStatus } from '../hooks'
import { RewardBloom } from './RewardBloom'

const DAYS = Array.from({ length: CHECKIN_CYCLE }, (_, i) => i + 1)

/**
 * Thẻ điểm danh hằng ngày (CheckInCard của web, bản thiết kế điện thoại trong plan của web):
 * chuỗi ngày, số phiếu, 7 ô của chu kỳ, nút điểm danh. Dùng trong bảng trượt ở trang chủ và màn
 * Phiếu đề cử. Tiêu đề do nơi chứa vẽ (BottomPanel có sẵn tiêu đề).
 */
export function CheckInCard({ onOpenRewards }: { onOpenRewards?: () => void }) {
  const colors = useThemeColors()
  const { data: status, isPending, isError } = useRewardStatus()
  const checkIn = useCheckIn()
  const [result, setResult] = useState<CheckInResult | null>(null)

  if (isError) {
    return (
      <Text role="alert" className="text-destructive">
        Không tải được thông tin điểm danh. Thử lại sau.
      </Text>
    )
  }
  if (isPending) {
    return (
      <View className="h-80 items-center justify-center" aria-busy>
        <ActivityIndicator colorClassName="accent-primary" />
      </View>
    )
  }

  const { claimed, today } = cycleProgress(status)
  const left = CHECKIN_CYCLE - claimed

  const submit = () =>
    checkIn.mutate(undefined, {
      onSuccess: (r) => {
        setResult(r)
        toast.success(r.reward > 1 ? `+${r.reward} phiếu: thưởng chuỗi 7 ngày!` : '+1 phiếu đề cử')
      },
      onError: (error) => toast.error(rewardErrorMessage(error)),
    })

  return (
    <View className="gap-5">
      <View className="flex-row gap-2.5">
        <View className="flex-1 gap-1.5 rounded-2xl bg-muted p-3.5">
          <View className="flex-row items-center gap-1.5">
            <Flame size={16} color={colors.neon} />
            <Text className="text-xs text-muted-foreground">Chuỗi liên tiếp</Text>
          </View>
          <View className="flex-row items-baseline gap-1.5">
            <Text className="font-heading-bold text-4xl leading-none">{status.streak}</Text>
            <Text className="text-sm text-muted-foreground">ngày</Text>
          </View>
        </View>
        <View className="flex-1 gap-1.5 rounded-2xl bg-muted p-3.5">
          <View className="flex-row items-center gap-1.5">
            <Ticket size={16} color={colors.roseGold} />
            <Text className="text-xs text-muted-foreground">Phiếu đề cử</Text>
          </View>
          <View className="flex-row items-baseline gap-1.5">
            <Text className="font-heading-bold text-4xl leading-none text-rose-gold">
              {status.balance}
            </Text>
            <Text className="text-sm text-muted-foreground">phiếu</Text>
          </View>
        </View>
      </View>

      <View role="list" aria-label="Chu kỳ 7 ngày" className="flex-row gap-1.5">
        {DAYS.map((day) => (
          <DayTile
            key={day}
            day={day}
            claimed={day <= claimed}
            isToday={day === today && !status.checkedInToday}
          />
        ))}
      </View>

      <View className="gap-2">
        <View className="flex-row justify-between">
          <Text className="text-xs text-muted-foreground">
            {left === 0 ? 'Đã nhận quà chuỗi 7 ngày' : `Còn ${left} ngày tới quà +3 phiếu`}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {claimed}/{CHECKIN_CYCLE}
          </Text>
        </View>
        <View className="h-1.5 overflow-hidden rounded-full bg-background">
          <View
            className="h-full rounded-full bg-neon"
            style={{ width: `${(claimed / CHECKIN_CYCLE) * 100}%` }}
          />
        </View>
      </View>

      {result && (
        <View
          role="status"
          className="flex-row items-center gap-3 rounded-2xl border border-neon/35 bg-secondary p-3"
        >
          <RewardBloom />
          <Text className="flex-1 text-sm">
            {result.reward > 1
              ? `+${result.reward} phiếu: thưởng chuỗi 7 ngày! Mai bắt đầu chu kỳ mới.`
              : '+1 phiếu đề cử. Hẹn bạn ngày mai nhé!'}
          </Text>
        </View>
      )}

      {status.checkedInToday ? (
        <Button
          variant="outline"
          disabled
          icon={<Check size={18} color={colors.mutedForeground} />}
          className="h-13 rounded-full"
          textClassName="text-muted-foreground"
        >
          Đã điểm danh, quay lại ngày mai
        </Button>
      ) : (
        <Button
          onPress={submit}
          pending={checkIn.isPending}
          pendingLabel="Đang điểm danh…"
          icon={<CalendarCheck size={18} color={colors.primaryForeground} />}
          className="h-13 rounded-full"
          textClassName="text-base"
        >
          {`Điểm danh nhận +${status.nextReward} phiếu`}
        </Button>
      )}

      {onOpenRewards && (
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Text className="text-sm text-muted-foreground">
            Dùng phiếu để đề cử truyện bạn thích
          </Text>
          <Pressable role="link" onPress={onOpenRewards} hitSlop={8}>
            <Text className="font-sans-semibold text-sm text-rose-gold">Phiếu của tôi →</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

function DayTile({ day, claimed, isToday }: { day: number; claimed: boolean; isToday: boolean }) {
  const colors = useThemeColors()
  const gift = day === CHECKIN_CYCLE
  const label = isToday ? 'Hôm nay' : gift && !claimed ? '+3' : `Ngày ${day}`
  const description = claimed ? 'đã nhận' : isToday ? 'hôm nay, chưa điểm danh' : 'chưa tới'

  return (
    <View
      role="listitem"
      aria-label={`Ngày ${day}${gift ? ' (quà 3 phiếu)' : ''}: ${description}`}
      className={cn(
        'flex-1 items-center gap-1.5 rounded-xl pt-2.5 pb-2',
        claimed ? 'bg-secondary' : gift ? 'bg-wine' : 'bg-muted',
        isToday && 'border-[1.5px] border-neon',
      )}
    >
      {claimed ? (
        <View className="size-7 items-center justify-center rounded-full bg-rose-gold">
          <Check size={15} strokeWidth={3} color={colors.background} />
        </View>
      ) : isToday ? (
        <View className="size-7 items-center justify-center rounded-full border-[1.5px] border-dashed border-neon">
          <Text className="font-sans-bold text-[11px] text-neon">{gift ? '+3' : '+1'}</Text>
        </View>
      ) : gift ? (
        <RewardBloom center="#ffffff" />
      ) : (
        <View className="size-7 items-center justify-center rounded-full bg-background">
          <Text className="font-sans-semibold text-[11px] text-muted-foreground">+1</Text>
        </View>
      )}
      <Text
        numberOfLines={1}
        className={cn(
          'text-[10px]',
          isToday
            ? 'font-sans-semibold text-neon'
            : gift && !claimed
              ? 'font-sans-bold text-white'
              : 'text-muted-foreground',
        )}
      >
        {label}
      </Text>
    </View>
  )
}
