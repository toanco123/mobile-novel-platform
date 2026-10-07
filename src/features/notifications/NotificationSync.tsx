import { type Href, router } from 'expo-router'
import type { NotificationResponse } from 'expo-notifications'
import { useEffect } from 'react'
import { useSession } from '@/features/auth/hooks'
import { Notifications } from './expoNotifications'
import { refreshPush } from './push'

// Đang mở app mà có thông báo: vẫn hiện như khi app ở nền
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

/** Mở đường dẫn trong thông báo (data.url, vd /story/<slug>/chapter-<n>) */
function openFrom(response: NotificationResponse | null) {
  const url = response?.notification.request.content.data?.url
  if (typeof url === 'string' && url.startsWith('/')) router.push(url as Href)
}

/**
 * Gắn một lần ở layout gốc: bấm thông báo chương mới thì mở đúng chương (cả khi app đang tắt), và
 * đăng ký lại mã khi đã đăng nhập mà đang bật thông báo
 */
export function NotificationSync() {
  const { data: user } = useSession()
  const userId = user?.id

  useEffect(() => {
    if (!Notifications) return
    // App được mở từ thông báo khi đang tắt
    void Notifications.getLastNotificationResponseAsync().then(openFrom)
    const subscription = Notifications.addNotificationResponseReceivedListener(openFrom)
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (userId) void refreshPush()
  }, [userId])

  return null
}
