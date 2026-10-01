// format.ts của app tự tính (Hermes thiếu Intl). Test chạy trên Node có Intl đầy đủ (ICU như trình
// duyệt) và so từng kết quả với cách web tính, để app hiện số, thời gian giống hệt web.
import { formatBytes, formatCount, formatDecimal, formatRelativeTime } from './format'

const compact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })
const rtf = new Intl.RelativeTimeFormat('vi-VN', { numeric: 'auto' })
const decimal = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })

// Bản của web (src/lib/format.ts), dùng Intl
const webUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]
function webRelativeTime(iso: string, now: number) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  for (const [unit, size] of webUnits) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return 'vừa xong'
}
function webBytes(bytes: number) {
  if (bytes === 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${decimal.format(bytes / (1024 * 1024))} MB`
}

test('formatCount giống Intl compact (vi-VN)', () => {
  const mantissas = [1, 1.04, 1.049, 1.05, 1.25, 1.35, 2.5, 4.35, 9.94, 9.95, 9.99, 9.9999]
  const values = [0, 1, 7, 42, 999, 1000]
  for (let exp = 0; exp <= 13; exp++) {
    for (const m of mantissas) values.push(Math.round(m * 10 ** exp))
  }
  for (let v = 0; v < 3000; v += 37) values.push(v, v * 997, v * 1_000_003)
  for (const v of values) expect(formatCount(v), String(v)).toBe(compact.format(v))
})

test('formatRelativeTime giống Intl.RelativeTimeFormat (vi-VN, numeric auto)', () => {
  const now = Date.parse('2026-09-25T12:00:00Z')
  const offsets: number[] = []
  for (let s = 0; s < 4 * 365 * 24 * 3600; s = Math.max(s + 1, Math.round(s * 1.07))) {
    offsets.push(s, -s)
  }
  for (const s of offsets) {
    const iso = new Date(now + s * 1000).toISOString()
    expect(formatRelativeTime(iso, now), String(s)).toBe(webRelativeTime(iso, now))
  }
})

test('formatBytes giống web', () => {
  for (let b = 0; b < 50 * 1024 * 1024; b = Math.max(b + 1, Math.round(b * 1.13))) {
    expect(formatBytes(b), String(b)).toBe(webBytes(b))
  }
})

describe('formatDecimal (số chữ của chương: toLocaleString vi-VN ở web)', () => {
  it('khớp Intl với số nguyên', () => {
    for (const n of [0, 7, 999, 1000, 1024, 12_345, 999_999, 1_000_000, 123_456_789]) {
      expect(formatDecimal(n)).toBe(n.toLocaleString('vi-VN'))
    }
  })
})
