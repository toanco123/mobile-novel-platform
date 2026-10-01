import { useCSSVariable } from 'uniwind'

const NAMES = [
  '--color-background',
  '--color-foreground',
  '--color-card',
  '--color-border',
  '--color-primary',
  '--color-primary-foreground',
  '--color-muted-foreground',
  '--color-destructive',
  '--color-rose-gold',
  '--color-neon',
] as const

/**
 * Màu của theme hiện tại cho chỗ không nhận className (thanh tab, header của điều hướng, màu icon
 * lucide). Còn lại dùng class token (bg-background, text-foreground...).
 */
export function useThemeColors() {
  const [
    background,
    foreground,
    card,
    border,
    primary,
    primaryForeground,
    mutedForeground,
    destructive,
    roseGold,
    neon,
  ] = useCSSVariable([...NAMES]).map(String)
  return {
    background,
    foreground,
    card,
    border,
    primary,
    primaryForeground,
    mutedForeground,
    destructive,
    roseGold,
    neon,
  }
}
