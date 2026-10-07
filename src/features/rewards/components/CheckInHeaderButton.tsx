import { router } from 'expo-router'
import { CalendarCheck } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { BottomPanel } from '@/components/common/BottomPanel'
import { useSession } from '@/features/auth/hooks'
import { useThemeColors } from '@/hooks/useThemeColors'
import { cn } from '@/lib/utils'
import { useRewardStatus } from '../hooks'
import { CheckInCard } from './CheckInCard'

/**
 * Nút điểm danh ở header trang chủ (CheckInButton của web), chỉ khi đã đăng nhập: chấm neon khi hôm
 * nay chưa điểm danh. Bấm mở bảng trượt chứa CheckInCard.
 */
export function CheckInHeaderButton() {
  const colors = useThemeColors()
  const { data: user } = useSession()
  const { data: status } = useRewardStatus()
  const [open, setOpen] = useState(false)
  if (!user) return null

  const pending = status ? !status.checkedInToday : false
  return (
    <>
      <Pressable
        role="button"
        aria-label={
          pending ? 'Điểm danh hằng ngày (chưa điểm danh hôm nay)' : 'Điểm danh hằng ngày'
        }
        hitSlop={8}
        onPress={() => setOpen(true)}
        className={cn(
          'size-10 items-center justify-center rounded-full active:bg-muted',
          pending && 'border border-neon bg-secondary',
        )}
      >
        <CalendarCheck size={21} color={pending ? colors.neon : colors.foreground} />
        {pending && (
          <View className="absolute top-1 right-1 size-2.5 rounded-full border-2 border-background bg-neon" />
        )}
      </Pressable>
      <BottomPanel
        open={open}
        onClose={() => setOpen(false)}
        title="Điểm danh hằng ngày"
        description="Đủ 7 ngày liền nhận thêm quà 3 phiếu."
      >
        <ScrollView contentContainerClassName="px-4 pt-1 pb-5">
          <CheckInCard
            onOpenRewards={() => {
              setOpen(false)
              router.push('/rewards')
            }}
          />
        </ScrollView>
      </BottomPanel>
    </>
  )
}
