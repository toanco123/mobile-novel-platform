// Theo dõi lỗi bằng Sentry (như src/lib/monitoring.ts của web, plan documents/plan-theo-doi-loi.md).
// Chỉ file này import @sentry/react-native. Lọc lỗi, ẩn token ở errorFilter.ts (chép từ web).
// Chỉ bật khi có EXPO_PUBLIC_SENTRY_DSN và không ở chế độ dev (thử trong Expo Go: `npx expo start
// --no-dev`); không như web, bundle đã nằm trên máy nên khởi tạo ngay, bắt được cả crash native.
import * as Sentry from '@sentry/react-native'
import {
  scrubBreadcrumb,
  scrubEvent,
  shouldReport,
  shouldSendEvent,
  toReportable,
} from './errorFilter'

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN
const enabled = !__DEV__ && !!dsn

export function initMonitoring() {
  if (!enabled) return
  Sentry.init({
    dsn,
    // Chỉ gắn id người dùng (setMonitoringUser); không lấy IP, không chụp màn hình
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    beforeSend: (event, hint) => {
      if (!shouldSendEvent(event, hint)) return null
      scrubEvent(event)
      return event
    },
    beforeBreadcrumb: (breadcrumb) => {
      scrubBreadcrumb(breadcrumb)
      return breadcrumb
    },
  })
}

/** Gửi lỗi lên Sentry nếu là lỗi bất thường (xem shouldReport); Sentry chưa bật thì bỏ qua */
export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!enabled || !shouldReport(error)) return
  const reportable = toReportable(error)
  Sentry.captureException(reportable.error, { extra: { ...context, ...reportable.extra } })
}

export function setMonitoringUser(id: string | null) {
  if (enabled) Sentry.setUser(id ? { id } : null)
}
