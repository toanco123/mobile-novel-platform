// Như errorFilter.test.ts của web, nhưng lớp lỗi dựng theo tên (file feature của app import React
// Native) và mất mạng giả qua NetInfo
let setNetwork: (state: { isConnected: boolean | null }) => void = () => {}
vi.mock('@react-native-community/netinfo', () => ({
  default: {
    addEventListener: (listener: typeof setNetwork) => {
      setNetwork = listener
      return () => {}
    },
  },
}))

const { scrubUrl, shouldReport, shouldSendEvent, toReportable } = await import('./errorFilter')

const named = (name: string, code?: string) =>
  Object.assign(new Error('lỗi'), { name, ...(code ? { code } : {}) })
const dbError = (code: string) => ({ code, message: 'lỗi', details: 'chi tiết', hint: null })

afterEach(() => setNetwork({ isConnected: true }))

describe('shouldReport', () => {
  test('lỗi nghiệp vụ của feature không gửi, mã unknown thì gửi', () => {
    expect(shouldReport(named('AuthError', 'invalid_credentials'))).toBe(false)
    expect(shouldReport(named('ChapterNotSavedError'))).toBe(false)
    expect(shouldReport(named('PushUnavailableError'))).toBe(false)
    expect(shouldReport(named('RewardError', 'already_checked_in'))).toBe(false)
    expect(shouldReport(named('AuthError', 'unknown'))).toBe(true)
  })

  test('lỗi DB: mã dự kiến không gửi, mã lạ thì gửi', () => {
    expect(shouldReport(dbError('P0001'))).toBe(false)
    expect(shouldReport(dbError('23505'))).toBe(false)
    expect(shouldReport(dbError('42501'))).toBe(true)
  })

  test('lỗi mạng của React Native và khi mất mạng không gửi', () => {
    expect(shouldReport(new TypeError('Network request failed'))).toBe(false)
    expect(
      shouldReport({
        code: '',
        message: 'TypeError: Network request failed',
        details: '',
        hint: '',
      }),
    ).toBe(false)
    setNetwork({ isConnected: false })
    expect(shouldReport(new Error('x is undefined'))).toBe(false)
  })

  test('lỗi code bình thường thì gửi', () => {
    expect(shouldReport(new TypeError("Cannot read property 'id' of undefined"))).toBe(true)
  })
})

test('shouldSendEvent dùng lỗi gốc của Sentry', () => {
  const event = { exception: { values: [{ type: 'AuthError', value: 'lỗi' }] } }
  expect(shouldSendEvent(event, { originalException: named('AuthError', 'unknown') })).toBe(true)
  expect(shouldSendEvent(event, { originalException: named('AuthError', 'banned') })).toBe(false)
})

test('scrubUrl ẩn mã trong deep link đăng nhập', () => {
  expect(scrubUrl('webtruyen://auth/callback?code=abc&next=%2F')).toBe(
    'webtruyen://auth/callback?code=[đã ẩn]&next=%2F',
  )
  expect(scrubUrl('exp://192.168.1.2:8081/--/reset-password#access_token=a&refresh_token=b')).toBe(
    'exp://192.168.1.2:8081/--/reset-password#access_token=[đã ẩn]&refresh_token=[đã ẩn]',
  )
})

test('toReportable đổi lỗi PostgREST thành Error có mã', () => {
  const { error, extra } = toReportable(dbError('42501'))
  expect(error.message).toBe('42501: lỗi')
  expect(extra.code).toBe('42501')
})
