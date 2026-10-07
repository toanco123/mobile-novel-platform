import { Minus, Plus, RotateCcw } from 'lucide-react-native'
import { router } from 'expo-router'
import { type ReactNode, useState } from 'react'
import { Platform, Pressable, ScrollView, Switch, View } from 'react-native'
import { ScopedTheme } from 'uniwind'
import { ChoiceList } from '@/components/common/ChoiceList'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { TextLink } from '@/components/ui/text-link'
import { useSession } from '@/features/auth/hooks'
import { useTheme } from '@/hooks/useTheme'
import { useThemeColors } from '@/hooks/useThemeColors'
import { findTtsVoice, TTS_VOICES } from '@/lib/ttsVoices'
import { cn } from '@/lib/utils'
import { fonts, toneTheme, tones } from '../readerOptions'
import { useSpeechSettings } from '../speech/useSpeechSettings'
import { voiceTips } from '../speech/voiceTips'
import { pickVoice, useVoices } from '../speech/voices'
import {
  FONT_SIZE_RANGE,
  LINE_HEIGHT_RANGE,
  READER_DEFAULTS,
  useReaderSettings,
} from '../useReaderSettings'

const segment = 'h-10 flex-1 items-center justify-center rounded-lg border'
const segmentIdle = 'border-border active:bg-muted'
const segmentActive = 'border-primary bg-primary/10'

/** Làm tròn bước giãn dòng (0,05) để cộng dồn không lệch số lẻ */
const roundStep = (value: number) => Math.round(value * 100) / 100

/**
 * Như ReaderSettingsPanel của web: màu nền, phông, cỡ chữ, giãn dòng; áp dụng ngay và được nhớ cho
 * lần đọc sau: cách đọc (từng chương / cuộn liên tục), màu nền, phông, cỡ chữ, giãn dòng, nghe truyện. Giãn dòng dùng nút − / +
 * thay thanh trượt.
 */
export function ReaderSettingsPanel() {
  const settings = useReaderSettings()
  const { update } = settings
  const appTheme = useTheme((s) => s.theme)
  const isDefault = (Object.keys(READER_DEFAULTS) as (keyof typeof READER_DEFAULTS)[]).every(
    (k) => settings[k] === READER_DEFAULTS[k],
  )

  return (
    <ScrollView contentContainerClassName="gap-7 px-4 pt-2 pb-6">
      <Group label="Cách đọc">
        <View role="radiogroup" aria-label="Cách đọc" className="flex-row gap-2">
          {(
            [
              [false, 'Từng chương'],
              [true, 'Cuộn liên tục'],
            ] as const
          ).map(([value, label]) => {
            const active = settings.continuous === value
            return (
              <Pressable
                key={label}
                role="radio"
                aria-checked={active}
                onPress={() => update({ continuous: value })}
                className={cn(segment, active ? segmentActive : segmentIdle)}
              >
                <Text
                  className={cn('text-sm', active ? 'text-foreground' : 'text-muted-foreground')}
                >
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <Text className="mt-2 text-xs text-muted-foreground">
          {settings.continuous
            ? 'Đọc gần hết chương thì chương sau tự nối vào bên dưới.'
            : 'Mỗi chương một trang, bấm “Chương sau” để sang chương mới.'}
        </Text>
      </Group>

      <Group label="Màu nền">
        <View role="radiogroup" aria-label="Màu nền" className="flex-row justify-between">
          {tones.map((t) => {
            const active = settings.tone === t.value
            return (
              <Pressable
                key={t.value}
                role="radio"
                aria-checked={active}
                aria-label={t.label}
                onPress={() => update({ tone: t.value })}
                className="items-center gap-1.5"
              >
                {/* Mẫu màu: vòng tròn mang đúng màu nền và màu chữ của lựa chọn đó */}
                <ScopedTheme theme={toneTheme[t.value] ?? appTheme}>
                  <View
                    className={cn(
                      'size-12 items-center justify-center rounded-full border bg-background',
                      active ? 'border-2 border-primary' : 'border-border',
                    )}
                  >
                    <Text aria-hidden className="font-reading text-base">
                      Aa
                    </Text>
                  </View>
                </ScopedTheme>
                <Text
                  className={cn('text-xs', active ? 'text-foreground' : 'text-muted-foreground')}
                >
                  {t.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </Group>

      <Group label="Phông chữ">
        <View role="radiogroup" aria-label="Phông chữ" className="flex-row gap-2">
          {fonts.map((f) => {
            const active = settings.font === f.value
            return (
              <Pressable
                key={f.value}
                role="radio"
                aria-checked={active}
                onPress={() => update({ font: f.value })}
                className={cn(segment, active ? segmentActive : segmentIdle)}
              >
                <Text
                  className={cn(
                    f.faces.regular,
                    'text-sm',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {f.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </Group>

      <Group label="Cỡ chữ">
        <Stepper
          value={`${settings.fontSize}px`}
          decreaseLabel="Giảm cỡ chữ"
          increaseLabel="Tăng cỡ chữ"
          canDecrease={settings.fontSize > FONT_SIZE_RANGE.min}
          canIncrease={settings.fontSize < FONT_SIZE_RANGE.max}
          onDecrease={() => update({ fontSize: settings.fontSize - 1 })}
          onIncrease={() => update({ fontSize: settings.fontSize + 1 })}
        />
      </Group>

      <Group label="Giãn dòng">
        <Stepper
          value={settings.lineHeight.toFixed(2).replace(/0$/, '')}
          decreaseLabel="Giảm giãn dòng"
          increaseLabel="Tăng giãn dòng"
          canDecrease={settings.lineHeight > LINE_HEIGHT_RANGE.min}
          canIncrease={settings.lineHeight < LINE_HEIGHT_RANGE.max}
          onDecrease={() =>
            update({ lineHeight: roundStep(settings.lineHeight - LINE_HEIGHT_RANGE.step) })
          }
          onIncrease={() =>
            update({ lineHeight: roundStep(settings.lineHeight + LINE_HEIGHT_RANGE.step) })
          }
        />
      </Group>

      <SpeechSettings />

      <ResetButton disabled={isDefault} onPress={settings.reset} />
    </ScrollView>
  )
}

/**
 * Như SpeechSettings của web: Giọng AI (cần đăng nhập) hoặc giọng tiếng Việt của máy (giọng ngôn ngữ
 * khác đọc sai dấu), tự chuyển chương, gợi ý cài giọng của máy hay hơn.
 */
function SpeechSettings() {
  const { voiceURI, aiVoice, autoNext, update } = useSpeechSettings()
  const { vietnamese } = useVoices()
  const { data: user } = useSession()
  const device = pickVoice(vietnamese, voiceURI)
  const ai = user ? findTtsVoice(aiVoice) : null
  const colors = useThemeColors()
  const options = [
    ...(user ? TTS_VOICES.map((v) => ({ value: `ai:${v.id}`, label: `${v.label} (AI)` })) : []),
    ...vietnamese.map((v) => ({ value: `device:${v.identifier}`, label: v.name })),
  ]
  const value = ai ? `ai:${ai.id}` : device ? `device:${device.identifier}` : ''
  const choose = (v: string) =>
    v.startsWith('ai:')
      ? update({ aiVoice: v.slice(3) })
      : update({ aiVoice: null, voiceURI: v.slice('device:'.length) })

  return (
    <Group label="Nghe truyện">
      <View className="gap-3">
        {options.length > 1 && (
          <ChoiceList label="Giọng đọc" options={options} value={value} onChange={choose} />
        )}
        {!user && (
          <Text className="text-xs text-muted-foreground">
            <TextLink className="text-xs" onPress={() => router.push('/login')}>
              Đăng nhập
            </TextLink>{' '}
            để nghe bằng Giọng AI đọc tự nhiên.
          </Text>
        )}
        {!ai && vietnamese.length === 0 && (
          <Text className="text-xs text-muted-foreground">
            Máy bạn chưa có giọng tiếng Việt nên có thể đọc sai dấu. Cài thêm giọng tiếng Việt trong
            Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói của máy để nghe rõ hơn.
          </Text>
        )}
        {!ai && <VoiceTips />}
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-sm">Hết chương tự đọc tiếp chương sau</Text>
          <Switch
            value={autoNext}
            onValueChange={(value) => update({ autoNext: value })}
            trackColor={{ true: colors.primary }}
            aria-label="Hết chương tự đọc tiếp chương sau"
          />
        </View>
      </View>
    </Group>
  )
}

/** Gợi ý cài giọng của máy hay hơn (thu gọn sẵn, như thẻ details của web) */
function VoiceTips() {
  const [open, setOpen] = useState(false)
  return (
    <View>
      <Pressable
        role="button"
        aria-expanded={open}
        onPress={() => setOpen((o) => !o)}
        className="self-start active:opacity-70"
      >
        <Text className="text-xs text-muted-foreground underline">
          Cách có giọng của máy hay hơn
        </Text>
      </Pressable>
      {open &&
        voiceTips(Platform.OS).map((tip) => (
          <Text key={tip} className="mt-1.5 text-xs text-muted-foreground">
            • {tip}
          </Text>
        ))}
    </View>
  )
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View>
      <Text className="mb-2.5 font-sans-medium text-sm">{label}</Text>
      {children}
    </View>
  )
}

function Stepper({
  value,
  decreaseLabel,
  increaseLabel,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
}: {
  value: string
  decreaseLabel: string
  increaseLabel: string
  canDecrease: boolean
  canIncrease: boolean
  onDecrease: () => void
  onIncrease: () => void
}) {
  const colors = useThemeColors()
  const round = 'size-11 items-center justify-center rounded-full border border-border'
  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        role="button"
        aria-label={decreaseLabel}
        aria-disabled={!canDecrease}
        disabled={!canDecrease}
        onPress={onDecrease}
        className={cn(round, canDecrease ? 'active:bg-muted' : 'opacity-40')}
      >
        <Minus size={18} color={colors.foreground} />
      </Pressable>
      <Text aria-live="polite" className="flex-1 text-center text-sm">
        {value}
      </Text>
      <Pressable
        role="button"
        aria-label={increaseLabel}
        aria-disabled={!canIncrease}
        disabled={!canIncrease}
        onPress={onIncrease}
        className={cn(round, canIncrease ? 'active:bg-muted' : 'opacity-40')}
      >
        <Plus size={18} color={colors.foreground} />
      </Pressable>
    </View>
  )
}

function ResetButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  const colors = useThemeColors()
  return (
    <Button
      variant="ghost"
      disabled={disabled}
      onPress={onPress}
      icon={<RotateCcw size={16} color={colors.mutedForeground} />}
      textClassName="text-muted-foreground"
    >
      Đặt lại mặc định
    </Button>
  )
}
