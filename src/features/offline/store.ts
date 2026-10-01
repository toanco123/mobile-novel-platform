// Như web: src/features/offline/store.ts (cùng tên hàm, cùng hành vi, cùng test). Khác web: kho là
// SQLite (expo-sqlite, mở ở sqlite.ts) thay IndexedDB. Kho chương trên máy cho đọc offline: chương đã
// mở, chương tải trước và chương người đọc tự tải về (ghim, không tự xóa). Nội dung chương là cột cuối
// của bảng, các truy vấn liệt kê / dọn kho không chọn cột này. Kho dùng chung cho cả máy vì nội dung
// chương là công khai. Không mở được kho thì kho coi như trống.
import type { ChapterContent, ChapterNeighbor } from '@/types/chapter'
import { type OfflineSql, openOfflineDatabase, type SqlParam } from './sqlite'

/** Chương không ghim giữ tối đa bấy nhiêu; vượt thì xóa chương lâu không dùng nhất */
export const MAX_AUTO_CHAPTERS = 300

/** Một dòng bảng chapters (không kèm nội dung) */
type ChapterRow = {
  id: string
  slug: string
  number: number
  /** JSON của Omit<ChapterContent, 'content'> */
  meta: string
  /** 1: người đọc tải về (không tự xóa) */
  pinned: 0 | 1
  /** Dung lượng nội dung (UTF-8) */
  bytes: number
  saved_at: string
  read_at: string | null
  /** Mốc xóa chương lâu không dùng: lần đọc cuối, chưa đọc thì lần lưu */
  used_at: string
  progress: number | null
}

/** Truyện có chương trong kho (tab "Đã lưu") */
export type SavedStory = {
  story: ChapterContent['story']
  /** Số các chương đã lưu, tăng dần */
  numbers: number[]
  /** Có chương người đọc tự tải về */
  pinned: boolean
  bytes: number
  /** Chương để "Đọc tiếp": đọc gần nhất, chưa đọc chương nào thì chương nhỏ nhất */
  resume: { number: number; progress: number }
  usedAt: string
}

/** Không mở được kho trên máy: không lưu được chương nào */
export class OfflineUnavailableError extends Error {
  constructor() {
    super('Máy này không cho lưu dữ liệu nên không tải về được.')
    this.name = 'OfflineUnavailableError'
  }
}

export class OfflineStorageFullError extends Error {
  constructor() {
    super('Bộ nhớ máy đã đầy.')
    this.name = 'OfflineStorageFullError'
  }
}

const idOf = (slug: string, number: number) => `${slug}#${number}`
const encoder = new TextEncoder()
/** SQLite báo SQLITE_FULL ("database or disk is full") khi máy hết chỗ */
const isQuotaError = (error: unknown) =>
  /SQLITE_FULL|disk is full/i.test(
    String((error as { message?: unknown } | null)?.message ?? error),
  )

/** Mở kho quá bấy nhiêu ms thì coi như không có kho (như web) */
export const OFFLINE_OPEN_TIMEOUT_MS = 3000

let dbPromise: Promise<OfflineSql | null> | undefined

function database() {
  dbPromise ??= open()
  return dbPromise
}

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY NOT NULL,
    slug TEXT NOT NULL,
    number INTEGER NOT NULL,
    meta TEXT NOT NULL,
    pinned INTEGER NOT NULL,
    bytes INTEGER NOT NULL,
    saved_at TEXT NOT NULL,
    read_at TEXT,
    used_at TEXT NOT NULL,
    progress REAL,
    content TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS chapters_by_slug ON chapters (slug);
  CREATE INDEX IF NOT EXISTS chapters_by_use ON chapters (pinned, used_at);
  PRAGMA user_version = 1;
`

async function open(): Promise<OfflineSql | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const opening = openOfflineDatabase().then(async (db) => {
      await db.execAsync(SCHEMA)
      return db
    })
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), OFFLINE_OPEN_TIMEOUT_MS)
    })
    return await Promise.race([opening, timeout])
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Kho dùng được không */
export async function offlineAvailable() {
  return (await database()) !== null
}

/** Chỉ dùng trong test: lần gọi sau mở kho mới */
export async function resetOfflineDatabase() {
  await dbPromise
  dbPromise = undefined
}

const COLUMNS = 'id, slug, number, meta, pinned, bytes, saved_at, read_at, used_at, progress'
const placeholders = (n: number) => Array.from({ length: n }, () => '?').join(', ')

/** Chương đã lưu, đủ nội dung; null nếu chưa có */
export async function getSavedChapter(slug: string, number: number) {
  const db = await database()
  if (!db) return null
  const row = await db.getFirstAsync<{ meta: string; content: string }>(
    'SELECT meta, content FROM chapters WHERE id = ?',
    [idOf(slug, number)],
  )
  return row ? ({ ...JSON.parse(row.meta), content: row.content } as ChapterContent) : null
}

async function put(db: OfflineSql, chapters: ChapterContent[], pinned: boolean) {
  const now = new Date().toISOString()
  await db.withTransactionAsync(async () => {
    for (const { content, ...meta } of chapters) {
      const id = idOf(meta.story.slug, meta.number)
      const old = await db.getFirstAsync<Pick<ChapterRow, 'pinned' | 'read_at' | 'progress'>>(
        'SELECT pinned, read_at, progress FROM chapters WHERE id = ?',
        [id],
      )
      const params: SqlParam[] = [
        id,
        meta.story.slug,
        meta.number,
        JSON.stringify(meta),
        pinned || old?.pinned === 1 ? 1 : 0,
        encoder.encode(content).length,
        now,
        old?.read_at ?? null,
        old?.read_at ?? now,
        old?.progress ?? null,
        content,
      ]
      await db.runAsync(
        `INSERT OR REPLACE INTO chapters (${COLUMNS}, content) VALUES (${placeholders(11)})`,
        params,
      )
    }
  })
}

/**
 * Xóa chương không ghim dùng lâu nhất tới khi còn MAX_AUTO_CHAPTERS; `fraction` > 0 thì xóa thêm
 * chừng ấy phần số chương không ghim (lấy chỗ khi bộ nhớ đầy). Không đụng truyện `keep`.
 */
async function evict(db: OfflineSql, keep: string, fraction = 0) {
  const counted = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM chapters WHERE pinned = 0',
    [],
  )
  const total = counted?.total ?? 0
  const excess = Math.max(total - MAX_AUTO_CHAPTERS, 0) + Math.ceil(total * fraction)
  if (excess <= 0) return
  // Dùng lâu nhất trước, cùng mốc thì theo id (như thứ tự chỉ mục của web)
  await db.runAsync(
    `DELETE FROM chapters WHERE id IN (
       SELECT id FROM chapters WHERE pinned = 0 AND slug <> ? ORDER BY used_at, id LIMIT ?
     )`,
    [keep, excess],
  )
}

/** Kho dùng chung cho cả máy nên chỉ giữ chương của truyện công khai */
export const isSavable = (chapter: ChapterContent) => chapter.story.visibility === 'published'

/**
 * Lưu (hoặc làm mới) các chương của truyện công khai (bỏ qua chương khác); giữ readAt/progress đã
 * có, chương đã ghim vẫn ghim. Sau đó dọn chương không ghim vượt giới hạn (trừ truyện vừa lưu). Bộ
 * nhớ đầy thì dọn 20% rồi thử lại một lần; vẫn đầy thì ném OfflineStorageFullError.
 */
export async function saveChapters(
  all: ChapterContent[],
  { pinned = false }: { pinned?: boolean } = {},
) {
  const chapters = all.filter(isSavable)
  const db = await database()
  if (!db || chapters.length === 0) return
  const keep = chapters[0].story.slug
  try {
    await put(db, chapters, pinned)
  } catch (error) {
    if (!isQuotaError(error)) throw error
    await evict(db, keep, 0.2)
    try {
      await put(db, chapters, pinned)
    } catch (retryError) {
      throw isQuotaError(retryError) ? new OfflineStorageFullError() : retryError
    }
  }
  await evict(db, keep)
}

/** Ghi đã đọc chương (và vị trí cuộn nếu có); chương chưa lưu thì bỏ qua */
export async function markRead(slug: string, number: number, progress?: number) {
  const db = await database()
  if (!db) return
  const now = new Date().toISOString()
  await db.runAsync(
    'UPDATE chapters SET read_at = ?, used_at = ?, progress = COALESCE(?, progress) WHERE id = ?',
    [now, now, progress ?? null, idOf(slug, number)],
  )
}

/** Ghim các chương đã có (người đọc tải về khoảng chương chứa chúng) */
export async function pinChapters(slug: string, numbers: number[]) {
  const db = await database()
  if (!db || numbers.length === 0) return
  const ids = numbers.map((n) => idOf(slug, n))
  await db.runAsync(`UPDATE chapters SET pinned = 1 WHERE id IN (${placeholders(ids.length)})`, ids)
}

/**
 * Lần theo chương sau (`next`) của các chương đã lưu từ chương `from`, tối đa `limit` chương. Trả
 * các chương đã có và số chương để hỏi tiếp máy chủ (null: đã đủ `limit` chương). Chương sau trong
 * bản lưu có thể đã cũ nên vẫn hỏi từ số kế tiếp khi bản lưu ghi "không có chương sau" (truyện ra
 * thêm chương sau khi lưu) hoặc nhảy cóc số (chương ở giữa lúc lưu còn là nháp, nay có thể đã đăng).
 */
export async function walkSaved(
  slug: string,
  from: number,
  limit: number,
): Promise<{ saved: number[]; missing: number | null }> {
  const db = await database()
  if (!db) return { saved: [], missing: from }
  const saved: number[] = []
  let number = from
  while (saved.length < limit) {
    const row = await db.getFirstAsync<{ meta: string }>('SELECT meta FROM chapters WHERE id = ?', [
      idOf(slug, number),
    ])
    if (!row) return { saved, missing: number }
    saved.push(number)
    number++
    const meta = JSON.parse(row.meta) as Omit<ChapterContent, 'content'>
    if (meta.next?.number !== number) break
  }
  return { saved, missing: saved.length < limit ? number : null }
}

/** Các truyện có chương trong kho, dùng gần nhất trước */
export async function listSavedStories(): Promise<SavedStory[]> {
  const db = await database()
  if (!db) return []
  const bySlug = new Map<string, ChapterRow[]>()
  for (const row of await db.getAllAsync<ChapterRow>(`SELECT ${COLUMNS} FROM chapters`, [])) {
    const list = bySlug.get(row.slug) ?? []
    list.push(row)
    bySlug.set(row.slug, list)
  }
  return [...bySlug.values()]
    .map((list): SavedStory => {
      list.sort((a, b) => a.number - b.number)
      const read = list
        .filter((r) => r.read_at !== null)
        .sort((a, b) => b.read_at!.localeCompare(a.read_at!))[0]
      // Thông tin truyện lấy từ bản lưu mới nhất
      const latest = list.reduce((a, b) => (b.saved_at > a.saved_at ? b : a))
      const resume = read ?? list[0]
      return {
        story: (JSON.parse(latest.meta) as Omit<ChapterContent, 'content'>).story,
        numbers: list.map((r) => r.number),
        pinned: list.some((r) => r.pinned === 1),
        bytes: list.reduce((sum, r) => sum + r.bytes, 0),
        resume: { number: resume.number, progress: resume.progress ?? 0 },
        usedAt: list.reduce((max, r) => (r.used_at > max ? r.used_at : max), ''),
      }
    })
    .sort((a, b) => b.usedAt.localeCompare(a.usedAt))
}

/** Các chương đã lưu của một truyện (số và tên), tăng dần */
export async function savedChapterList(slug: string): Promise<ChapterNeighbor[]> {
  const db = await database()
  if (!db) return []
  const rows = await db.getAllAsync<{ number: number; meta: string }>(
    'SELECT number, meta FROM chapters WHERE slug = ? ORDER BY number',
    [slug],
  )
  return rows.map((r) => ({ number: r.number, title: JSON.parse(r.meta).title as string }))
}

export async function removeSavedChapter(slug: string, number: number) {
  const db = await database()
  if (!db) return
  await db.runAsync('DELETE FROM chapters WHERE id = ?', [idOf(slug, number)])
}

export async function removeSavedStory(slug: string) {
  const db = await database()
  if (!db) return
  await db.runAsync('DELETE FROM chapters WHERE slug = ?', [slug])
}

export async function clearSaved() {
  const db = await database()
  if (!db) return
  await db.runAsync('DELETE FROM chapters', [])
}
