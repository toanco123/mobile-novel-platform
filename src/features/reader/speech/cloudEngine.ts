// Như cloudEngine.ts của web (src/features/reader/speech/cloudEngine.ts) trên expo-audio: phát lần
// lượt các file MP3 của đoạn bằng một AudioPlayer dùng chung. Phát cả khi khóa màn hình (chế độ âm
// thanh phát nền + plugin expo-audio `enableBackgroundPlayback`; Android cần bật điều khiển trên màn
// hình khóa thì mới phát lâu được). Không cần clip mở khóa như iOS Safari.
import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import type { TtsErrorCode } from '@/features/tts/shared'
import type { ClipQueue } from './clipQueue'
import type { SpeechEngine } from './session'

type CloudEngineOptions = {
  queue: ClipQueue
  /** Giọng AI đang chọn (id trong TTS_VOICES) */
  voice: () => string | null
  rate: () => number
  autoNext: () => boolean
  error: (code: TtsErrorCode) => Error
  /** Tên hiện trên màn hình khóa */
  nowPlaying: (chapter: number) => { title: string; artist: string }
}

/** Còn bấy nhiêu đoạn nữa là hết chương thì tạo trước chương sau (như web) */
const WARM_NEXT_BEFORE_END = 3
/** File không tải được trong khoảng này thì coi như mất mạng (expo-audio không báo lỗi tải) */
const LOAD_TIMEOUT_MS = 15_000

export type CloudEngine = SpeechEngine & {
  /** Tắt điều khiển trên màn hình khóa (khi đã dừng hẳn) */
  release: () => void
}

export function createCloudEngine(options: CloudEngineOptions): CloudEngine {
  let player: AudioPlayer | null = null
  let lockScreenChapter: number | null = null

  const ensure = () => {
    if (!player) {
      player = createAudioPlayer(null, { updateInterval: 250 })
      void setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
      }).catch(() => {})
    }
    return player
  }

  function playUrl(url: string, signal: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      const p = ensure()
      let loaded = false
      const timer = setTimeout(() => {
        if (loaded) return
        cleanup()
        reject(options.error('network'))
      }, LOAD_TIMEOUT_MS)
      const sub = p.addListener('playbackStatusUpdate', (status) => {
        if (status.isLoaded) loaded = true
        if (status.didJustFinish) {
          cleanup()
          resolve()
        }
      })
      const onAbort = () => {
        cleanup()
        resolve()
      }
      function cleanup() {
        clearTimeout(timer)
        sub.remove()
        signal.removeEventListener('abort', onAbort)
      }
      signal.addEventListener('abort', onAbort)
      p.replace({ uri: url })
      p.setPlaybackRate(options.rate(), 'high')
      p.play()
    })
  }

  return {
    async speak(job, signal) {
      const voice = options.voice()
      if (!voice) throw options.error('unknown')
      const { title, parts } = await options.queue.clips({
        voice,
        slug: job.slug,
        chapter: job.chapter,
        index: job.index,
        total: job.total,
        title: job.title !== null,
      })
      if (signal.aborted) return
      if (
        job.next !== null &&
        job.index >= job.total - WARM_NEXT_BEFORE_END &&
        options.autoNext()
      ) {
        options.queue.warm(voice, job.slug, job.next)
      }
      if (lockScreenChapter !== job.chapter) {
        lockScreenChapter = job.chapter
        ensure().setActiveForLockScreen(true, options.nowPlaying(job.chapter))
      }
      for (const url of [...title, ...parts]) {
        if (signal.aborted) return
        await playUrl(url, signal)
      }
    },
    cancel: () => player?.pause(),
    pause: () => player?.pause(),
    resume: () => player?.play(),
    setRate: (rate) => player?.setPlaybackRate(rate, 'high'),
    release: () => {
      if (lockScreenChapter === null) return
      lockScreenChapter = null
      player?.setActiveForLockScreen(false)
    },
  }
}
