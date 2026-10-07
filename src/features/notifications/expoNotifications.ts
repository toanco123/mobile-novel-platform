// expo-notifications chỉ nạp ngoài Expo Go: từ SDK 53, vừa import là nó đăng ký nghe mã thông báo
// đẩy, mà Expo Go trên Android thì ném lỗi ngay lúc đó (cả layout gốc không mở được). Expo Go vốn
// không nhận thông báo đẩy, nên ở đó coi như không có thư viện này.
import Constants, { ExecutionEnvironment } from 'expo-constants'

type NotificationsModule = typeof import('expo-notifications')

export const Notifications: NotificationsModule | null =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    ? null
    : // oxlint-disable-next-line typescript/no-require-imports -- import có điều kiện, xem trên
      (require('expo-notifications') as NotificationsModule)
