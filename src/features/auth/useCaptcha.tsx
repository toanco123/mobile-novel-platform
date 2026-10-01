// Captcha Cloudflare Turnstile cho các form gọi Supabase Auth bằng email + mật khẩu (đăng nhập, đăng
// ký, quên mật khẩu, kiểm tra lại mật khẩu khi đổi mật khẩu / xóa tài khoản). Supabase Auth đang bật
// Captcha nên thiếu mã là bị từ chối (captcha_failed). Cùng API với useCaptcha của web.
//
// React Native không chạy được script của Turnstile, nên widget nằm trong một WebView nhỏ. Trang
// trong WebView lấy baseUrl là địa chỉ web: tên miền khớp danh sách tên miền của site key (dùng
// chung site key với web). Mã gửi về bằng postMessage.
import { useCallback, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import WebView, { type WebViewMessageEvent } from 'react-native-webview'
import { Text } from '@/components/ui/text'
import { useTheme } from '@/hooks/useTheme'
import { SITE_URL } from '@/lib/siteUrl'

const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY

/** Chờ Turnstile tự xác minh tối đa chừng này (thường xong trước khi điền form xong) */
const TOKEN_TIMEOUT_MS = 30_000

/** Chiều cao ô xác minh khi Cloudflare cần người dùng bấm */
const WIDGET_HEIGHT = 72

type Message =
  | { type: 'token'; token: string }
  | { type: 'expired' }
  | { type: 'error'; code?: string }
  | { type: 'interactive'; show: boolean }

const widgetHtml = (siteKey: string, theme: string) => `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}</style>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad" async defer></script>
</head><body><div id="widget"></div><script>
  var post = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)) };
  var widgetId;
  function onTurnstileLoad() {
    widgetId = turnstile.render('#widget', {
      sitekey: ${JSON.stringify(siteKey)},
      theme: ${JSON.stringify(theme)},
      language: 'vi',
      size: 'flexible',
      appearance: 'interaction-only',
      callback: function (token) { post({ type: 'token', token: token }) },
      'expired-callback': function () { post({ type: 'expired' }) },
      'error-callback': function (code) { post({ type: 'error', code: String(code) }) },
      'before-interactive-callback': function () { post({ type: 'interactive', show: true }) },
      'after-interactive-callback': function () { post({ type: 'interactive', show: false }) },
    });
  }
  window.resetCaptcha = function () { if (widgetId !== undefined) turnstile.reset(widgetId) };
</script></body></html>`

/**
 * `element` đặt trong form (chỉ hiện ô xác minh khi Cloudflare cần người dùng bấm). Lúc gửi form gọi
 * `token()` lấy mã (undefined khi không bật captcha; null khi không xác minh được, `element` tự hiện
 * lời báo), gửi xong gọi `reset()` vì mỗi mã chỉ dùng được một lần.
 */
export function useCaptcha() {
  const webView = useRef<WebView>(null)
  // Theme lúc mở form; đổi theme khi form đang mở không cần vẽ lại widget
  const [theme] = useState(() => useTheme.getState().theme)
  const html = useMemo(() => (SITE_KEY ? widgetHtml(SITE_KEY, theme) : ''), [theme])
  const [interactive, setInteractive] = useState(false)
  const [failed, setFailed] = useState(false)
  const current = useRef<string | null>(null)
  const errored = useRef(false)
  // Lần gửi form đang chờ mã: nhận mã hoặc lỗi thì báo ngay, không chờ hết giờ
  const waiting = useRef<((token: string | null) => void) | null>(null)

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    let message: Message
    try {
      message = JSON.parse(event.nativeEvent.data) as Message
    } catch {
      return
    }
    if (message.type === 'token') {
      current.current = message.token
      errored.current = false
      setFailed(false)
      waiting.current?.(message.token)
    } else if (message.type === 'expired') {
      current.current = null
    } else if (message.type === 'error') {
      current.current = null
      errored.current = true
      waiting.current?.(null)
    } else if (message.type === 'interactive') {
      setInteractive(message.show)
    }
  }, [])

  const token = useCallback(async (): Promise<string | undefined | null> => {
    if (!SITE_KEY) return undefined
    setFailed(false)
    const ready = errored.current
      ? null
      : (current.current ??
        (await new Promise<string | null>((resolve) => {
          const timer = setTimeout(() => resolve(null), TOKEN_TIMEOUT_MS)
          waiting.current = (value) => {
            clearTimeout(timer)
            resolve(value)
          }
        })))
    waiting.current = null
    if (!ready) setFailed(true)
    return ready
  }, [])

  const reset = useCallback(() => {
    current.current = null
    errored.current = false
    webView.current?.injectJavaScript('window.resetCaptcha && window.resetCaptcha(); true;')
  }, [])

  // Không có gì để hiện thì đặt ngoài luồng bố cục: khung cao 0 vẫn chiếm một khoảng gap của form
  const visible = interactive || failed
  const element = SITE_KEY ? (
    <View className={visible ? 'gap-2' : 'absolute inset-x-0 top-0 h-0 overflow-hidden'}>
      <View style={{ height: interactive ? WIDGET_HEIGHT : 0 }} className="overflow-hidden">
        <WebView
          ref={webView}
          source={{ html, baseUrl: SITE_URL }}
          originWhitelist={['*']}
          onMessage={onMessage}
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          style={{ backgroundColor: 'transparent', height: WIDGET_HEIGHT }}
        />
      </View>
      {failed && (
        <Text role="alert" className="text-sm text-destructive">
          Chưa xác minh được bạn không phải robot. Kiểm tra mạng rồi thử lại nhé.
        </Text>
      )}
    </View>
  ) : null

  return { element, token, reset }
}
