// Mã thông báo của máy (Expo Push) và trạng thái bật / tắt thông báo chương mới trên máy này.
// Expo Go không nhận thông báo đẩy từ SDK 53: cần bản build riêng (EAS); mã cần projectId của EAS
// (`eas init` ghi vào app.json, extra.eas.projectId).
import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { create } from 'zustand'
import { readLocal, writeLocal } from '@/lib/localStore'
import { registerPushToken, unregisterPushToken } from './api'

const TOKEN_KEY = 'push-token'

/** Không lấy được mã thông báo trên máy này; message là lời báo cho người dùng */
export class PushUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PushUnavailableError'
  }
}

/** Mã đã đăng ký của máy này (có = đang bật thông báo) */
export const usePushToken = create<{ token: string | null }>()(() => ({
  token: readLocal<string | null>(TOKEN_KEY, null),
}))

const setToken = (token: string | null) => {
  writeLocal(TOKEN_KEY, token)
  usePushToken.setState({ token })
}

async function devicePushToken() {
  if (!Device.isDevice) {
    throw new PushUnavailableError('Máy ảo không nhận được thông báo đẩy. Hãy thử trên điện thoại.')
  }
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new PushUnavailableError(
      'Expo Go không nhận được thông báo đẩy. Cần bản cài đặt riêng của app (bản dev hoặc bản phát hành).',
    )
  }
  const projectId =
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId ??
    Constants.easConfig?.projectId
  if (!projectId) {
    throw new PushUnavailableError('App chưa được cấu hình thông báo (thiếu projectId của EAS).')
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Chương mới',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }
  let { status } = await Notifications.getPermissionsAsync()
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status
  if (status !== 'granted') {
    throw new PushUnavailableError(
      'Bạn chưa cho phép thông báo. Bật trong Cài đặt của máy → Thông báo → app này.',
    )
  }
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data
}

/** Bật thông báo chương mới cho tài khoản đang đăng nhập trên máy này */
export async function enablePush() {
  const token = await devicePushToken()
  await registerPushToken(token, Platform.OS === 'ios' ? 'ios' : 'android')
  setToken(token)
}

/** Tắt thông báo trên máy này (cả trước khi đăng xuất); lỗi mạng thì vẫn quên mã trên máy */
export async function disablePush() {
  const token = usePushToken.getState().token
  if (!token) return
  try {
    await unregisterPushToken(token)
  } finally {
    setToken(null)
  }
}

/** Mở app khi đang bật thông báo: đăng ký lại (mã có thể đổi, hoặc máy đã đổi tài khoản) */
export async function refreshPush() {
  if (!usePushToken.getState().token) return
  try {
    await enablePush()
  } catch {
    // Mất quyền thông báo, mất mạng: giữ nguyên, lần mở app sau thử lại
  }
}
