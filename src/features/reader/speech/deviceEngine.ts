// Như deviceEngine.ts của web (src/features/reader/speech/deviceEngine.ts) trên expo-speech: giọng của
// máy đọc từng câu ngắn của đoạn. Không có pause tại chỗ: tạm dừng = dừng hẳn rồi đọc lại đoạn.
import * as Speech from 'expo-speech'
import type { Voice } from 'expo-speech'
import type { SpeechEngine } from './session'
import { splitForSpeech } from './splitForSpeech'

type DeviceVoiceSettings = () => { rate: number; voice: Voice | null }

export function createDeviceEngine(settings: DeviceVoiceSettings): SpeechEngine {
  return {
    speak: (job, signal) =>
      new Promise<void>((resolve) => {
        const chunks = splitForSpeech(job.text)
        if (job.title) chunks.unshift(job.title)
        let k = 0
        const speakNext = () => {
          if (signal.aborted) return
          if (k >= chunks.length) return resolve()
          const { rate, voice } = settings()
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
      }),
    cancel: () => void Speech.stop(),
  }
}
