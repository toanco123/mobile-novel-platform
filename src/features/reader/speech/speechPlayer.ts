// Nghe truyện (useChapterSpeech của web) trên expo-speech. Khác web: bộ phát dùng chung cả app (store
// Zustand + hàm ở module) thay vì hook của trang đọc, vì mỗi chương của app là một màn riêng: chuyển
// chương thì màn cũ bị bỏ mà giọng đọc vẫn phải đọc tiếp. Màn đọc đăng ký cách sang chương sau
// (setSpeechAdvance) và giữ / nhả bộ phát (claimSpeech / releaseSpeech) để rời hẳn trang đọc thì dừng.
import * as Speech from 'expo-speech'
import { create } from 'zustand'
import { chapterQuery } from '@/features/chapters/hooks'
import { blockTexts, parseContent } from '@/features/chapters/richText'
import { queryClient } from '@/lib/queryClient'
import { splitForSpeech } from './splitForSpeech'
import { useSpeechSettings } from './useSpeechSettings'
import { pickVoice, voicesQuery } from './voices'

export type SpeechStatus = 'idle' | 'playing' | 'paused'

export type SpeechState = {
  status: SpeechStatus
  slug: string | null
  /** Chương đang đọc */
  chapter: number | null
  /** Chỉ số đoạn đang đọc trong chương (cùng cách đánh số đơn vị đọc của ChapterArticle) */
  paragraph: number
  /** Tổng số đoạn của chương đang đọc (0 khi chưa tải xong) */
  total: number
}

const IDLE: SpeechState = { status: 'idle', slug: null, chapter: null, paragraph: 0, total: 0 }

export const useSpeechPlayer = create<SpeechState>()(() => IDLE)

const set = (patch: Partial<SpeechState>) => useSpeechPlayer.setState(patch)

// Mã lượt phát: mỗi lần phát/dừng tăng lên, callback của lượt cũ tự bỏ qua
let run = 0
// Sau stop() đôi khi câu nói kế tiếp bị bỏ qua; chờ một nhịp trước khi đọc (như web)
const AFTER_STOP_MS = 60

let advance: ((slug: string, next: number) => void) | null = null
/** Màn đọc đăng ký cách mở chương sau khi giọng đọc tự chuyển chương */
export const setSpeechAdvance = (fn: typeof advance) => {
  advance = fn
}

async function play(slug: string, chapter: number, from: number) {
  const id = ++run
  void Speech.stop()
  const s = useSpeechPlayer.getState()
  // Sang chương khác thì chưa biết số đoạn (thanh điều khiển hiện "đang chuẩn bị")
  set({
    status: 'playing',
    slug,
    chapter,
    paragraph: from,
    total: s.slug === slug && s.chapter === chapter ? s.total : 0,
  })
  const [data, voices] = await Promise.all([
    queryClient.fetchQuery(chapterQuery(queryClient, slug, chapter)).catch(() => null),
    queryClient.fetchQuery(voicesQuery).catch(() => []),
    new Promise((r) => setTimeout(r, AFTER_STOP_MS)),
  ])
  if (id !== run) return
  if (!data) {
    set(IDLE)
    return
  }
  // Mỗi đoạn, tiêu đề, mục danh sách là một đơn vị đọc, khớp với số đoạn của ChapterArticle
  const paragraphs = blockTexts(parseContent(data.content))

  const speakParagraph = (i: number) => {
    if (id !== run) return
    if (i >= paragraphs.length) {
      if (useSpeechSettings.getState().autoNext && data.next) {
        advance?.(slug, data.next.number)
        void play(slug, data.next.number, 0)
      } else {
        set(IDLE)
      }
      return
    }
    set({ status: 'playing', slug, chapter, paragraph: i, total: paragraphs.length })
    const chunks = splitForSpeech(paragraphs[i])
    // Bắt đầu từ đầu chương thì đọc tên chương trước
    if (i === 0 && from === 0) chunks.unshift(`Chương ${data.number}. ${data.title}.`)
    let k = 0
    const speakNext = () => {
      if (id !== run) return
      if (k >= chunks.length) return speakParagraph(i + 1)
      const { rate, voiceURI } = useSpeechSettings.getState()
      const voice = pickVoice(voices, voiceURI)
      Speech.speak(chunks[k++], {
        language: voice?.language ?? 'vi-VN',
        voice: voice?.identifier,
        rate,
        onDone: speakNext,
        // Lỗi một câu thì bỏ câu đó, đọc câu sau
        onError: speakNext,
      })
    }
    speakNext()
  }
  speakParagraph(from)
}

function halt() {
  run++
  void Speech.stop()
}

export const speech = {
  start: (slug: string, chapter: number, paragraph = 0) => void play(slug, chapter, paragraph),
  /** Như web: tạm dừng = dừng hẳn và nhớ đoạn đang đọc */
  pause: () => {
    halt()
    set({ status: 'paused' })
  },
  resume: () => {
    const { slug, chapter, paragraph } = useSpeechPlayer.getState()
    if (slug !== null && chapter !== null) void play(slug, chapter, paragraph)
  },
  stop: () => {
    halt()
    set(IDLE)
  },
  /** Nhảy tới đoạn trước (-1) / sau (+1) */
  skip: (delta: number) => {
    const { slug, chapter, paragraph, total } = useSpeechPlayer.getState()
    if (slug === null || chapter === null) return
    const last = Math.max(0, total - 1)
    void play(slug, chapter, Math.min(last, Math.max(0, paragraph + delta)))
  },
  setRate: (rate: number) => {
    useSpeechSettings.getState().update({ rate })
    // Đang đọc thì đọc lại đoạn hiện tại với tốc độ mới
    const { status, slug, chapter, paragraph } = useSpeechPlayer.getState()
    if (status === 'playing' && slug !== null && chapter !== null)
      void play(slug, chapter, paragraph)
  },
}

// Rời trang đọc thì dừng. Chuyển chương là bỏ màn cũ rồi mở màn mới: màn cũ nhả, màn mới giữ lại
// ngay sau đó, nên chỉ dừng khi không có màn đọc nào giữ trong một khoảng ngắn
const RELEASE_MS = 600
let releaseTimer: ReturnType<typeof setTimeout> | undefined
export const claimSpeech = () => clearTimeout(releaseTimer)
export const releaseSpeech = () => {
  clearTimeout(releaseTimer)
  releaseTimer = setTimeout(() => {
    if (useSpeechPlayer.getState().status !== 'idle') speech.stop()
  }, RELEASE_MS)
}
