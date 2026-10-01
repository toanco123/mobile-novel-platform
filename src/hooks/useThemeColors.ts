import { useCSSVariable } from 'uniwind'

const NAMES = [
  '--color-background',
  '--color-foreground',
  '--color-card',
  '--color-border',
  '--color-primary',
  '--color-muted-foreground',
  '--color-neon',
] as const

/**
 * Màu của theme hiện tại cho chỗ không nhận className (thanh tab, header của điều hướng, icon).
 * Còn lại dùng class token (bg-background, text-foreground...).
 */
export function useThemeColors() {
  const [background, foreground, card, border, primary, mutedForeground, neon] = useCSSVariable([
    ...NAMES,
  ]).map(String)
  return { background, foreground, card, border, primary, mutedForeground, neon }
}
