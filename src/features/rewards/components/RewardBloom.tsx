import Svg, { Circle, Ellipse, G } from 'react-native-svg'
import { useThemeColors } from '@/hooks/useThemeColors'

/**
 * Bông hoa 5 cánh của logo "Sách nở hoa" (như RewardBloom của web): biểu tượng quà ở ô ngày 7 và
 * lời chúc sau khi điểm danh. Cánh màu neon, nhụy rose-gold (hoặc `center` khi nằm trên nền wine).
 */
export function RewardBloom({ size = 28, center }: { size?: number; center?: string }) {
  const colors = useThemeColors()
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
      <G transform="translate(14 14)" fill={colors.neon}>
        {[0, 72, 144, 216, 288].map((angle) => (
          <Ellipse key={angle} rx={3.6} ry={6.4} transform={`rotate(${angle}) translate(0 -6)`} />
        ))}
      </G>
      <Circle cx={14} cy={14} r={3} fill={center ?? colors.roseGold} />
    </Svg>
  )
}
