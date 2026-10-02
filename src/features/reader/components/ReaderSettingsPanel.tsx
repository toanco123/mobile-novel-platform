import { Minus, Plus, RotateCcw } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, Switch, View } from 'react-native'
import { ScopedTheme } from 'uniwind'
import { ChoiceList } from '@/components/common/ChoiceList'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useTheme } from '@/hooks/useTheme'
import { useThemeColors } from '@/hooks/useThemeColors'
import { cn } from '@/lib/utils'
import { fonts, toneTheme, tones } from '../readerOptions'
import { useSpeechSettings } from '../speech/useSpeechSettings'
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
 * lần đọc sau, kèm cài đặt nghe truyện. Chưa có cách đọc (cuộn liên tục, bước 5b); giãn dòng dùng nút − / +
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
 * Như SpeechSettings của web: giọng đọc và tự chuyển chương cho nghe truyện. Chỉ liệt kê giọng tiếng
 * Việt (giọng ngôn ngữ khác đọc sai dấu); máy chưa có thì báo cách cài.
 */
function SpeechSettings() {
  const { voiceURI, autoNext, update } = useSpeechSettings()
  const { vietnamese } = useVoices()
  const current = pickVoice(vietnamese, voiceURI)
  const colors = useThemeColors()

  return (
    <Group label="Nghe truyện">
      <View className="gap-3">
        {vietnamese.length > 1 && current && (
          <ChoiceList
            label="Giọng đọc"
            options={vietnamese.map((v) => ({ value: v.identifier, label: v.name }))}
            value={current.identifier}
            onChange={(id) => update({ voiceURI: id })}
          />
        )}
        {vietnamese.length === 0 && (
          <Text className="text-xs text-muted-foreground">
            Máy bạn chưa có giọng tiếng Việt nên có thể đọc sai dấu. Cài thêm giọng tiếng Việt trong
            Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói của máy để nghe rõ hơn.
          </Text>
        )}
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
