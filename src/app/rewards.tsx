import { router } from 'expo-router'
import { CalendarCheck, Ticket } from 'lucide-react-native'
import { type ReactNode, useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { Pagination } from '@/components/common/Pagination'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useSession } from '@/features/auth/hooks'
import {
  CHECKIN_BONUS_REWARD,
  CHECKIN_REWARD,
  type LedgerEntry,
  ledgerText,
  VOTE_MIN_ACCOUNT_AGE_DAYS,
} from '@/features/rewards/api'
import { CheckInCard } from '@/features/rewards/components/CheckInCard'
import { RewardBloom } from '@/features/rewards/components/RewardBloom'
import { useTicketHistory } from '@/features/rewards/hooks'
import { useThemeColors } from '@/hooks/useThemeColors'
import { cn } from '@/lib/utils'

/** Phiếu đề cử (trang /rewards của web): điểm danh, cách nhận và dùng phiếu, lịch sử phiếu */
export default function RewardsScreen() {
  const { data: user, isPending } = useSession()

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator colorClassName="accent-primary" />
      </View>
    )
  }
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <Text className="text-center text-muted-foreground">
          Đăng nhập để điểm danh mỗi ngày và nhận phiếu đề cử.
        </Text>
        <Button onPress={() => router.push('/login')} className="rounded-full px-6">
          Đăng nhập
        </Button>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-4 pt-2 pb-12">
      <View className="gap-5 rounded-3xl border border-border bg-card p-5">
        <View className="gap-1">
          <Text role="heading" className="font-heading-bold text-[28px] leading-tight">
            Điểm danh hằng ngày
          </Text>
          <Text className="text-sm text-muted-foreground">
            Đủ 7 ngày liền nhận thêm quà 3 phiếu.
          </Text>
        </View>
        <CheckInCard />
      </View>
      <HowItWorks />
      <TicketHistory />
    </ScrollView>
  )
}

function HowItWorks() {
  const colors = useThemeColors()
  return (
    <View className="gap-4 rounded-3xl border border-border bg-card p-5">
      <Text role="heading" className="font-heading-bold text-[26px] leading-tight">
        Cách nhận và dùng phiếu
      </Text>
      <Rule
        icon={<CalendarCheck size={20} color={colors.neon} />}
        title={`Điểm danh mỗi ngày: +${CHECKIN_REWARD} phiếu`}
      >
        Ngày tính theo giờ Việt Nam, mỗi ngày một lần.
      </Rule>
      <Rule
        icon={<RewardBloom size={24} center="#ffffff" />}
        iconClassName="bg-wine"
        title={`Đủ 7 ngày liền: +${CHECKIN_BONUS_REWARD} phiếu`}
      >
        Lỡ một ngày thì chuỗi bắt đầu lại từ ngày 1.
      </Rule>
      <Rule icon={<Ticket size={20} color={colors.roseGold} />} title="Đề cử truyện bạn thích">
        Truyện nhiều phiếu lên bảng Đề cử tuần. Đề cử truyện hiện làm được trên web.
      </Rule>
      <Text className="rounded-xl bg-muted p-3.5 text-sm leading-relaxed text-muted-foreground">
        Phiếu không hết hạn và không đổi ra tiền. Tài khoản tạo đủ {VOTE_MIN_ACCOUNT_AGE_DAYS} ngày
        mới đề cử được.
      </Text>
    </View>
  )
}

function Rule({
  icon,
  iconClassName,
  title,
  children,
}: {
  icon: ReactNode
  iconClassName?: string
  title: string
  children: ReactNode
}) {
  return (
    <View className="flex-row gap-3.5">
      <View
        className={cn('size-10 items-center justify-center rounded-xl bg-secondary', iconClassName)}
      >
        {icon}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-semibold">{title}</Text>
        <Text className="text-sm leading-relaxed text-muted-foreground">{children}</Text>
      </View>
    </View>
  )
}

// en-GB: "07/10" và "14:45" (vi-VN ghi ngày tháng bằng dấu gạch và đặt giờ trước)
const dayMonth = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit' })
const hourMinute = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const dateTime = (iso: string) => {
  const date = new Date(iso)
  return `${dayMonth.format(date)} ${hourMinute.format(date)}`
}

function TicketHistory() {
  const [page, setPage] = useState(1)
  const { data, isPending, isError, isPlaceholderData } = useTicketHistory(page)

  return (
    <View className="gap-3">
      <Text role="heading" className="font-heading-bold text-[28px]">
        Lịch sử phiếu
      </Text>
      {isError ? (
        <Text className="text-muted-foreground">Không tải được lịch sử phiếu. Thử lại sau.</Text>
      ) : isPending ? (
        <View className="h-40 items-center justify-center">
          <ActivityIndicator colorClassName="accent-primary" />
        </View>
      ) : data.total === 0 ? (
        <Text className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
          Chưa có giao dịch nào. Điểm danh để nhận phiếu đầu tiên.
        </Text>
      ) : (
        <>
          <View
            className={cn(
              'overflow-hidden rounded-2xl border border-border bg-card',
              isPlaceholderData && 'opacity-60',
            )}
          >
            {data.items.map((entry, i) => (
              <HistoryRow key={entry.id} entry={entry} first={i === 0} />
            ))}
          </View>
          <Pagination
            page={data.page}
            pageCount={data.pageCount}
            onChange={setPage}
            label="Phân trang lịch sử phiếu"
          />
        </>
      )}
    </View>
  )
}

function HistoryRow({ entry, first }: { entry: LedgerEntry; first: boolean }) {
  const plus = entry.amount > 0
  return (
    <View
      className={cn('flex-row items-center gap-3 px-4 py-3.5', !first && 'border-t border-border')}
    >
      <View className={cn('size-2 rounded-full', plus ? 'bg-neon' : 'bg-rose-gold')} />
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={2} className="text-[15px]">
          {ledgerText(entry)}
          {entry.story ? <Text className="text-rose-gold"> {entry.story.title}</Text> : null}
        </Text>
        <Text className="text-xs text-muted-foreground">{dateTime(entry.createdAt)}</Text>
      </View>
      <View className="items-end gap-0.5">
        <Text className={cn('font-sans-bold', plus ? 'text-neon' : 'text-foreground')}>
          {plus ? '+' : '−'}
          {Math.abs(entry.amount)}
        </Text>
        <Text className="text-xs text-muted-foreground">còn {entry.balanceAfter}</Text>
      </View>
    </View>
  )
}
