// Nghe truyện (useChapterSpeech của web): lõi `session.ts` chép từ web, đọc bằng giọng của máy
// (expo-speech) hoặc Giọng AI (expo-audio). Khác web: bộ phát dùng chung cả app (store Zustand + hàm ở
// module) thay vì hook của trang đọc, vì mỗi chương của app là một màn riêng: chuyển chương thì màn cũ
// bị bỏ mà giọng đọc vẫn phải đọc tiếp. Màn đọc đăng ký cách sang chương sau (setSpeechAdvance) và giữ
// / nhả bộ phát (claimSpeech / releaseSpeech) để rời hẳn trang đọc thì dừng.
import { toast } from 'sonner-native'
import { create } from 'zustand'
import { authKeys } from '@/features/auth/hooks'
import { chapterQuery } from '@/features/chapters/hooks'
import { blockTexts, parseContent } from '@/features/chapters/richText'
import { fetchClips, TtsError, ttsFallbackMessage } from '@/features/tts/api'
import { SITE_NAME } from '@/config/site'
import { reportError } from '@/lib/monitoring'
import { queryClient } from '@/lib/queryClient'
import { isTtsVoice } from '@/lib/ttsVoices'
import { createClipQueue } from './clipQueue'
import { createCloudEngine } from './cloudEngine'
import { createDeviceEngine } from './deviceEngine'
import { createSpeechSession, IDLE_SPEECH, type SpeechState } from './session'
import { useSpeechSettings } from './useSpeechSettings'
import { pickVoice, voicesQuery } from './voices'

export type { SpeechState, SpeechStatus } from './session'

export const useSpeechPlayer = create<SpeechState>()(() => IDLE_SPEECH)

/** Giọng AI dùng được: đã đăng nhập và đang chọn một giọng AI */
export const aiVoiceReady = () =>
  !!queryClient.getQueryData(authKeys.session) && isTtsVoice(useSpeechSettings.getState().aiVoice)

let advance: ((slug: string, next: number) => void) | null = null
/** Màn đọc đăng ký cách mở chương sau khi giọng đọc tự chuyển chương */
export const setSpeechAdvance = (fn: typeof advance) => {
  advance = fn
}

// Tên truyện / chương của các chương đã tải, cho màn hình khóa
const titles = new Map<string, { story: string; chapter: string }>()
let currentSlug: string | null = null

const settings = () => useSpeechSettings.getState()
const voices = () => queryClient.getQueryData(voicesQuery.queryKey) ?? []

const ai = createCloudEngine({
  queue: createClipQueue({ fetchClips, error: (code) => new TtsError(code) }),
  voice: () => settings().aiVoice,
  rate: () => settings().rate,
  autoNext: () => settings().autoNext,
  error: (code) => new TtsError(code),
  nowPlaying: (chapter) => {
    const t = titles.get(`${currentSlug}|${chapter}`)
    return { title: t?.chapter ?? `Chương ${chapter}`, artist: t?.story ?? SITE_NAME }
  },
})

const session = createSpeechSession({
  loadChapter: async (slug, chapter) => {
    currentSlug = slug
    const [data] = await Promise.all([
      queryClient.fetchQuery(chapterQuery(queryClient, slug, chapter)).catch(() => null),
      // Giọng của máy cần danh sách giọng (lấy một lần, giữ trong cache)
      queryClient.fetchQuery(voicesQuery).catch(() => []),
    ])
    if (!data) return null
    titles.set(`${slug}|${chapter}`, {
      story: data.story.title,
      chapter: `Chương ${data.number}. ${data.title}`,
    })
    return {
      number: data.number,
      title: data.title,
      // Mỗi đoạn, tiêu đề, mục danh sách là một đơn vị đọc, khớp với số đoạn của ChapterArticle
      paragraphs: blockTexts(parseContent(data.content)),
      next: data.next?.number ?? null,
    }
  },
  device: createDeviceEngine(() => ({
    rate: settings().rate,
    voice: pickVoice(voices(), settings().voiceURI),
  })),
  ai,
  useAi: aiVoiceReady,
  autoNext: () => settings().autoNext,
  onState: (state) => {
    useSpeechPlayer.setState(state)
    if (state.status === 'idle') ai.release()
  },
  onAdvance: (slug, next) => advance?.(slug, next),
  onFallback: (error, continued) => {
    reportError(error)
    toast(ttsFallbackMessage(error, continued))
  },
})

export const speech = {
  start: (slug: string, chapter: number, paragraph = 0) => session.start(slug, chapter, paragraph),
  /** Giọng của máy: tạm dừng = dừng hẳn và nhớ đoạn đang đọc (như web); Giọng AI dừng tại chỗ */
  pause: () => session.pause(),
  resume: () => session.resume(),
  stop: () => session.stop(),
  /** Nhảy tới đoạn trước (-1) / sau (+1) */
  skip: (delta: number) => session.skip(delta),
  setRate: (rate: number) => {
    useSpeechSettings.getState().update({ rate })
    session.setRate(rate)
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
