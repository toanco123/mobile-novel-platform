// Test của web (src/features/offline/store.test.ts), chạy trên SQLite thật của Node (node:sqlite) thay
// expo-sqlite: cùng câu SQL, cùng hành vi. Ba test cuối thay "IndexedDB bị chặn / treo" bằng "mở
// file SQLite lỗi / treo".
import { DatabaseSync } from 'node:sqlite'
import { fakeChapter } from '@/test/fakeChapter'
import type { OfflineSql, SqlParam } from './sqlite'
import { openOfflineDatabase } from './sqlite'
import {
  clearSaved,
  getSavedChapter,
  listSavedStories,
  markRead,
  MAX_AUTO_CHAPTERS,
  OFFLINE_OPEN_TIMEOUT_MS,
  offlineAvailable,
  OfflineStorageFullError,
  pinChapters,
  removeSavedChapter,
  removeSavedStory,
  resetOfflineDatabase,
  saveChapters,
  savedChapterList,
  walkSaved,
} from './store'

vi.mock('./sqlite', () => ({ openOfflineDatabase: vi.fn() }))

/** Bọc node:sqlite theo đúng các hàm expo-sqlite mà kho dùng */
function nodeSql(): OfflineSql {
  const db = new DatabaseSync(':memory:')
  return {
    execAsync: async (source) => void db.exec(source),
    runAsync: async (source, params) => db.prepare(source).run(...(params as never[])),
    getFirstAsync: async <T>(source: string, params: SqlParam[]) =>
      (db.prepare(source).get(...(params as never[])) as T | undefined) ?? null,
    getAllAsync: async <T>(source: string, params: SqlParam[]) =>
      db.prepare(source).all(...(params as never[])) as T[],
    withTransactionAsync: async (task) => {
      db.exec('BEGIN')
      try {
        await task()
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }
    },
  }
}

let sql: OfflineSql

beforeEach(async () => {
  await resetOfflineDatabase()
  sql = nodeSql()
  vi.mocked(openOfflineDatabase).mockResolvedValue(sql)
})

const range = (slug: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => fakeChapter(slug, from + i))

/** Giả giờ hệ thống (chỉ Date) */
const at = (iso: string) => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(iso))
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

test('lưu rồi đọc lại đủ nội dung; chương chưa lưu là null', async () => {
  const chapter = fakeChapter('mua-ha', 3)
  await saveChapters([chapter])
  expect(await getSavedChapter('mua-ha', 3)).toEqual(chapter)
  expect(await getSavedChapter('mua-ha', 4)).toBeNull()
  expect(await savedChapterList('mua-ha')).toEqual([{ number: 3, title: 'Chương 3' }])
})

test('lưu lại (làm mới) giữ chỗ đã đọc và cờ ghim', async () => {
  await saveChapters([fakeChapter('mua-ha', 1)], { pinned: true })
  await markRead('mua-ha', 1, 0.5)
  await saveChapters([{ ...fakeChapter('mua-ha', 1), content: '<p>Bản sửa.</p>' }])
  expect(await getSavedChapter('mua-ha', 1)).toMatchObject({ content: '<p>Bản sửa.</p>' })
  expect(await listSavedStories()).toMatchObject([
    { pinned: true, numbers: [1], resume: { number: 1, progress: 0.5 } },
  ])
})

test('truyện chưa công khai không được lưu', async () => {
  const draft = fakeChapter('nhap', 1)
  await saveChapters([{ ...draft, story: { ...draft.story, visibility: 'draft' } }])
  expect(await getSavedChapter('nhap', 1)).toBeNull()
})

test(`quá ${MAX_AUTO_CHAPTERS} chương tự lưu: xóa chương lâu không dùng nhất, giữ chương ghim và truyện vừa lưu`, async () => {
  at('2026-09-01T00:00:00Z')
  await saveChapters(range('cu', 1, 5))
  at('2026-09-02T00:00:00Z')
  await saveChapters(range('ghim', 1, 3), { pinned: true })
  await saveChapters(range('doc-lai', 1, 2))
  at('2026-09-03T00:00:00Z')
  await markRead('cu', 5) // vừa đọc lại: chưa bị xóa
  at('2026-09-04T00:00:00Z')
  await saveChapters(range('moi', 1, MAX_AUTO_CHAPTERS - 2))

  // Không ghim: cu 5 + doc-lai 2 + moi 298 = 305 → xóa 5 chương dùng lâu nhất ngoài truyện "moi"
  expect((await savedChapterList('cu')).map((c) => c.number)).toEqual([5])
  expect((await savedChapterList('doc-lai')).map((c) => c.number)).toEqual([2])
  expect(await savedChapterList('ghim')).toHaveLength(3)
  expect(await savedChapterList('moi')).toHaveLength(MAX_AUTO_CHAPTERS - 2)
})

test('walkSaved lần theo chương sau của bản lưu, dừng ở chương còn thiếu', async () => {
  await saveChapters([...range('mua-ha', 5, 7), fakeChapter('mua-ha', 10, { last: 10 })])
  expect(await walkSaved('mua-ha', 5, 5)).toEqual({ saved: [5, 6, 7], missing: 8 })
  expect(await walkSaved('mua-ha', 5, 2)).toEqual({ saved: [5, 6], missing: null })
  // Bản lưu ghi "không có chương sau" có thể đã cũ (truyện đang ra): hỏi máy chủ từ chương kế
  expect(await walkSaved('mua-ha', 10, 5)).toEqual({ saved: [10], missing: 11 })
  expect(await walkSaved('mua-ha', 1, 5)).toEqual({ saved: [], missing: 1 })
})

test('walkSaved: bản lưu nhảy cóc số chương (chương giữa lúc đó còn là nháp) thì hỏi máy chủ chương bị nhảy', async () => {
  const skipped = { ...fakeChapter('mua-ha', 10), next: { number: 12, title: 'Chương 12' } }
  await saveChapters([skipped, ...range('mua-ha', 12, 14)])
  expect(await walkSaved('mua-ha', 10, 5)).toEqual({ saved: [10], missing: 11 })
})

test('ghim, xóa một chương, xóa một truyện, xóa tất cả', async () => {
  await saveChapters([...range('a', 1, 3), ...range('b', 1, 2)])
  await pinChapters('a', [2])
  expect((await listSavedStories()).find((s) => s.story.slug === 'a')?.pinned).toBe(true)
  await removeSavedChapter('a', 1)
  expect((await savedChapterList('a')).map((c) => c.number)).toEqual([2, 3])
  await removeSavedStory('a')
  expect(await getSavedChapter('a', 2)).toBeNull()
  expect((await listSavedStories()).map((s) => s.story.slug)).toEqual(['b'])
  await clearSaved()
  expect(await listSavedStories()).toEqual([])
})

test('danh sách truyện: dùng gần nhất trước; "Đọc tiếp" là chương đọc gần nhất, chưa đọc thì chương đầu', async () => {
  at('2026-09-01T00:00:00Z')
  await saveChapters(range('a', 3, 5))
  at('2026-09-02T00:00:00Z')
  await saveChapters(range('b', 1, 2))
  at('2026-09-03T00:00:00Z')
  await markRead('a', 4, 0.3)
  const stories = await listSavedStories()
  expect(stories.map((s) => s.story.slug)).toEqual(['a', 'b'])
  expect(stories[0]).toMatchObject({
    numbers: [3, 4, 5],
    pinned: false,
    resume: { number: 4, progress: 0.3 },
  })
  expect(stories[0].bytes).toBeGreaterThan(0)
  expect(stories[1].resume).toEqual({ number: 1, progress: 0 })
})

test('bộ nhớ đầy: dọn 20% chương cũ rồi lưu lại; vẫn đầy thì báo OfflineStorageFullError', async () => {
  await saveChapters(range('cu', 1, 10))
  const run = sql.runAsync.bind(sql)
  // Chỉ lệnh ghi chương báo đầy (lệnh xóa để dọn kho vẫn chạy), như spy put của IndexedDB ở web
  const full = async (source: string, params: SqlParam[]) => {
    if (source.startsWith('INSERT')) throw new Error('SQLITE_FULL: database or disk is full')
    return run(source, params)
  }
  const spy = vi.spyOn(sql, 'runAsync').mockImplementationOnce(full)
  await saveChapters([fakeChapter('moi', 1)])
  expect(await getSavedChapter('moi', 1)).not.toBeNull()
  expect(await savedChapterList('cu')).toHaveLength(8)

  spy.mockImplementation(full)
  await expect(saveChapters([fakeChapter('moi', 2)])).rejects.toBeInstanceOf(
    OfflineStorageFullError,
  )
})

test('không mở được file SQLite: kho coi như trống, không báo lỗi', async () => {
  await resetOfflineDatabase()
  vi.mocked(openOfflineDatabase).mockRejectedValue(new Error('Không mở được'))
  expect(await offlineAvailable()).toBe(false)
  await expect(saveChapters([fakeChapter('mua-ha', 1)])).resolves.toBeUndefined()
  expect(await getSavedChapter('mua-ha', 1)).toBeNull()
  expect(await listSavedStories()).toEqual([])
  expect(await walkSaved('mua-ha', 1, 5)).toEqual({ saved: [], missing: 1 })
})

test(`mở kho treo: sau ${OFFLINE_OPEN_TIMEOUT_MS / 1000} giây coi như không có kho`, async () => {
  await resetOfflineDatabase()
  vi.mocked(openOfflineDatabase).mockReturnValue(new Promise(() => {}))
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  const available = offlineAvailable()
  await vi.advanceTimersByTimeAsync(OFFLINE_OPEN_TIMEOUT_MS)
  expect(await available).toBe(false)
  expect(await getSavedChapter('mua-ha', 1)).toBeNull()
})
