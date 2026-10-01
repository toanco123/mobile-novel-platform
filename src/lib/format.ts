// Chép từ web (src/lib/format.ts), cùng hàm và cùng kết quả. Khác web: Hermes (JS của React Native)
// không có Intl.RelativeTimeFormat, bỏ qua `notation: 'compact'` và làm tròn số lẻ khác ICU, nên số
// rút gọn, thời gian tương đối và số thập phân tính bằng JS thuần. format.parity.test.ts so từng kết
// quả với Intl đầy đủ (ICU của Node, như trình duyệt) để giữ giống web.

/** Làm tròn 1 chữ số lẻ, nửa lên như ICU (toPrecision bỏ sai số dấu phẩy động: 4.35 * 10 = 43.4999…) */
const round1 = (value: number) => Math.round(Number((value * 10).toPrecision(12))) / 10

/** Số kiểu Việt Nam, tối đa 1 chữ số lẻ: 1024.5 → "1.024,5" (như Intl.NumberFormat('vi-VN')) */
export function formatDecimal(value: number) {
  const rounded = round1(Math.abs(value))
  const [int, frac] = rounded.toFixed(1).split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${value < 0 && rounded > 0 ? '-' : ''}${grouped}${frac === '0' ? '' : `,${frac}`}`
}

/** Đơn vị rút gọn của ICU tiếng Việt, lớn trước */
const compactUnits: [number, string][] = [
  [1e12, 'NT'],
  [1e9, 'T'],
  [1e6, 'Tr'],
  [1e3, 'N'],
]

/** Như ICU: số và đơn vị cách nhau bằng dấu cách không ngắt dòng */
const NBSP = '\u00a0'

/** 1234567 → "1,2 Tr" */
export function formatCount(value: number) {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  for (let i = 0; i < compactUnits.length; i++) {
    const [size, symbol] = compactUnits[i]
    if (abs < size) continue
    const n = round1(abs / size)
    // Làm tròn lên tới 1000 thì sang đơn vị lớn hơn (999.950 → "1 Tr"), như ICU
    if (n >= 1000 && i > 0) {
      const [bigger, biggerSymbol] = compactUnits[i - 1]
      return `${sign}${formatDecimal(round1(abs / bigger))}${NBSP}${biggerSymbol}`
    }
    return `${sign}${formatDecimal(n)}${NBSP}${symbol}`
  }
  if (round1(abs) >= 1000) return `${sign}1${NBSP}N`
  return `${sign}${formatDecimal(abs)}`
}

type RelativeUnit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute'

const units: [RelativeUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

const unitWord: Record<RelativeUnit, string> = {
  year: 'năm',
  month: 'tháng',
  week: 'tuần',
  day: 'ngày',
  hour: 'giờ',
  minute: 'phút',
}

/** Cách nói riêng của `numeric: 'auto'` (Intl.RelativeTimeFormat tiếng Việt) */
const namedOffsets: Partial<Record<RelativeUnit, Record<number, string>>> = {
  year: { [-1]: 'năm ngoái', 0: 'năm nay', 1: 'năm sau' },
  month: { [-1]: 'tháng trước', 0: 'tháng này', 1: 'tháng sau' },
  week: { [-1]: 'tuần trước', 0: 'tuần này', 1: 'tuần sau' },
  day: { [-2]: 'Hôm kia', [-1]: 'Hôm qua', 0: 'Hôm nay', 1: 'Ngày mai', 2: 'Ngày kia' },
  hour: { 0: 'giờ này' },
  minute: { 0: 'phút này' },
}

function relative(value: number, unit: RelativeUnit) {
  const named = namedOffsets[unit]?.[value]
  if (named) return named
  const amount = `${formatDecimal(Math.abs(value))} ${unitWord[unit]}`
  return value < 0 ? `${amount} trước` : `sau ${amount} nữa`
}

/** ISO date → "5 phút trước", "Hôm qua"... */
export function formatRelativeTime(iso: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative(Math.round(seconds / size), unit)
  }
  return 'vừa xong'
}

// Hermes định dạng ngày đúng như trình duyệt
const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** ISO date → "25/09/2026" */
export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso))
}

/** Dung lượng: 870400 → "850 KB", 1310720 → "1,3 MB" */
export function formatBytes(bytes: number) {
  if (bytes === 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${formatDecimal(bytes / (1024 * 1024))} MB`
}
