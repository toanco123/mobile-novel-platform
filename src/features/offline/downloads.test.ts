// Logic tải về đọc offline (downloads.ts), theo các ca trong download.test.tsx của web (bên web chạy
// qua giao diện). Kho là SQLite thật của Node; máy chủ là getChapterRange giả.
import { toast } from 'sonner-native'
import { getChapterRange } from '@/features/chapters/api'
import { fakeChapter } from '@/test/fakeChapter'
import { nodeSql } from '@/test/nodeSql'
import { cancelDownload, DOWNLOAD_BATCH, downloadChapters, useDownloads } from './downloads'
import { openOfflineDatabase } from './sqlite'
import {
  getSavedChapter,
  listSavedStories,
  resetOfflineDatabase,
  saveChapters,
  savedChapterList,
} from './store'

vi.mock('./sqlite', () => ({ openOfflineDatabase: vi.fn() }))
vi.mock('@/features/chapters/api', () => ({ getChapterRange: vi.fn() }))
vi.mock('sonner-native', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@react-native-community/netinfo', () => ({
  default: { addEventListener: () => () => {} },
}))

const LAST = 100

/** Máy chủ giả: các chương liền nhau tới chương LAST */
const server = (slug: string, from: number, count: number) =>
  Array.from({ length: Math.max(0, Math.min(count, LAST - from + 1)) }, (_, i) =>
    fakeChapter(slug, from + i, { last: LAST }),
  )

const numbers = async (slug: string) => (await savedChapterList(slug)).map((c) => c.number)

beforeEach(async () => {
  await resetOfflineDatabase()
  useDownloads.setState({ bySlug: {} })
  vi.clearAllMocks()
  vi.mocked(openOfflineDatabase).mockResolvedValue(nodeSql())
  vi.mocked(getChapterRange).mockImplementation(async (slug, from, count) =>
    server(slug, from, count),
  )
})

test('tải 20 chương từ chương 3: đủ 20 chương trên máy, đã ghim, báo xong', async () => {
  await downloadChapters({ slug: 'mua-ha', title: 'Mùa Hạ', from: 3, total: 20 })
  expect(await numbers('mua-ha')).toEqual(Array.from({ length: 20 }, (_, i) => i + 3))
  expect(await getSavedChapter('mua-ha', 22)).toMatchObject({ number: 22 })
  expect((await listSavedStories())[0].pinned).toBe(true)
  expect(useDownloads.getState().bySlug['mua-ha']).toMatchObject({
    status: 'done',
    done: 20,
    total: 20,
  })
  expect(toast.success).toHaveBeenCalledWith('Đã tải 20 chương "Mùa Hạ"', expect.anything())
})

test('tải nhiều đợt, mỗi đợt tối đa DOWNLOAD_BATCH chương', async () => {
  await downloadChapters({ slug: 'mua-ha', title: 'Mùa Hạ', from: 1, total: 45 })
  expect(vi.mocked(getChapterRange).mock.calls.map(([, from, count]) => [from, count])).toEqual([
    [1, DOWNLOAD_BATCH],
    [21, DOWNLOAD_BATCH],
    [41, 5],
  ])
  expect(await numbers('mua-ha')).toHaveLength(45)
})

test('chương đã có trên máy được ghim tại chỗ, chỉ tải phần còn thiếu', async () => {
  await saveChapters(server('mua-ha', 1, 5))
  await downloadChapters({ slug: 'mua-ha', title: 'Mùa Hạ', from: 1, total: 10 })
  expect(vi.mocked(getChapterRange).mock.calls.map(([, from, count]) => [from, count])).toEqual([
    [6, 5],
  ])
  expect((await listSavedStories())[0]).toMatchObject({
    pinned: true,
    numbers: [...Array(10)].map((_, i) => i + 1),
  })
})

test('chuỗi chương đã lưu dừng ở chương "mới nhất" cũ (truyện đã ra thêm): vẫn tải tiếp từ máy chủ', async () => {
  await saveChapters([1, 2, 3].map((n) => fakeChapter('mua-ha', n, { last: 3 })))
  await downloadChapters({ slug: 'mua-ha', title: 'Mùa Hạ', from: 1, total: 6 })
  expect(await numbers('mua-ha')).toEqual([1, 2, 3, 4, 5, 6])
})

test('hủy giữa chừng: báo đã hủy ngay, đợt đang tải dở không lưu; tải lại chỉ lấy phần còn thiếu', async () => {
  let release: () => void = () => {}
  vi.mocked(getChapterRange)
    .mockImplementationOnce(async (slug, from, count) => server(slug, from, count))
    .mockImplementationOnce(
      (slug, from, count) =>
        new Promise((resolve) => {
          release = () => resolve(server(slug, from, count))
        }),
    )
  const running = downloadChapters({ slug: 'mua-ha', title: 'Mùa Hạ', from: 1, total: 40 })
  await vi.waitFor(() => expect(getChapterRange).toHaveBeenCalledTimes(2))
  cancelDownload('mua-ha')
  expect(useDownloads.getState().bySlug['mua-ha']).toMatchObject({ status: 'cancelled', done: 20 })
  release()
  await running
  expect(await numbers('mua-ha')).toHaveLength(20)
  expect(toast.success).not.toHaveBeenCalled()

  vi.mocked(getChapterRange).mockClear()
  await downloadChapters({ slug: 'mua-ha', title: 'Mùa Hạ', from: 1, total: 40 })
  expect(vi.mocked(getChapterRange).mock.calls.map(([, from]) => from)).toEqual([21])
  expect(await numbers('mua-ha')).toHaveLength(40)
})

test('mất mạng giữa chừng: dừng, báo đã tải được bao nhiêu chương', async () => {
  vi.mocked(getChapterRange)
    .mockImplementationOnce(async (slug, from, count) => server(slug, from, count))
    .mockRejectedValueOnce(new Error('TypeError: Network request failed'))
  await downloadChapters({ slug: 'mua-ha', title: 'Mùa Hạ', from: 1, total: 40 })
  const message = 'Mất mạng, đã tải được 20 chương. Có mạng lại thì bấm tải tiếp.'
  expect(useDownloads.getState().bySlug['mua-ha']).toMatchObject({
    status: 'failed',
    error: message,
  })
  expect(toast.error).toHaveBeenCalledWith(message)
})

test('không mở được kho trên máy: báo lỗi, không tải', async () => {
  await resetOfflineDatabase()
  vi.mocked(openOfflineDatabase).mockRejectedValue(new Error('Không mở được'))
  await downloadChapters({ slug: 'mua-ha', title: 'Mùa Hạ', from: 1, total: 20 })
  expect(getChapterRange).not.toHaveBeenCalled()
  expect(useDownloads.getState().bySlug['mua-ha']).toMatchObject({
    status: 'failed',
    error: 'Máy này không cho lưu dữ liệu nên không tải về được.',
  })
})
