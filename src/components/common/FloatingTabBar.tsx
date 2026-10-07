import * as Haptics from 'expo-haptics'
import type { BottomTabBarProps, BottomTabNavigationOptions } from 'expo-router/tabs'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { useThemeColors } from '@/hooks/useThemeColors'

/** Tab đang chọn rộng hơn tab khác (1 + EXPAND lần) để có chỗ cho nhãn */
const EXPAND = 1.4
const LABEL_MAX_WIDTH = 100
const ICON_SIZE = 22
const SPRING = { damping: 17, stiffness: 190, mass: 0.9 }

/**
 * Thanh tab dạng viên nổi: tab đang chọn là viên màu primary có icon + nhãn, tab khác chỉ có icon.
 * Mọi chuyển động đi theo một giá trị `position` (chỉ số tab, chạy bằng lò xo): độ rộng từng tab và
 * vị trí viên đều tính từ nó nên luôn khớp nhau, kể cả khi nhảy qua nhiều tab. Reanimated tự bỏ
 * chuyển động khi máy bật Giảm chuyển động.
 *
 * Thanh vẫn chiếm chỗ trong bố cục (không đè lên màn hình), nên các màn không phải chừa khoảng dưới.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const position = useSharedValue(state.index)
  const [rowWidth, setRowWidth] = useState(0)
  const count = state.routes.length

  useEffect(() => {
    position.set(withSpring(state.index, SPRING))
  }, [position, state.index])

  const unit = rowWidth / (count + EXPAND)
  const pillStyle = useAnimatedStyle(() => ({
    width: unit * (1 + EXPAND),
    transform: [{ translateX: clampedPosition(position, count) * unit }],
  }))

  return (
    <View
      className="bg-background px-4 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom - 4, 12) }}
    >
      <View
        className="rounded-full border border-border bg-card p-1.5"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.14,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        <View
          role="tablist"
          className="h-12 flex-row"
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', top: 0, bottom: 0 }, pillStyle]}
          >
            <View className="flex-1 rounded-full bg-primary" />
          </Animated.View>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key]
            const focused = state.index === index
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })
              if (focused || event.defaultPrevented) return
              void Haptics.selectionAsync()
              navigation.navigate(route.name, route.params)
            }
            const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key })
            return (
              <TabItem
                key={route.key}
                index={index}
                count={count}
                position={position}
                options={options}
                label={options.title ?? route.name}
                focused={focused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            )
          })}
        </View>
      </View>
    </View>
  )
}

/** Vị trí lò xo giới hạn trong dải tab: vượt quá đầu/cuối thì viên lệch khỏi tab */
function clampedPosition(position: SharedValue<number>, count: number) {
  'worklet'
  return Math.min(Math.max(position.get(), 0), count - 1)
}

function TabItem({
  index,
  count,
  position,
  options,
  label,
  focused,
  onPress,
  onLongPress,
}: {
  index: number
  count: number
  position: SharedValue<number>
  options: BottomTabNavigationOptions
  label: string
  focused: boolean
  onPress: () => void
  onLongPress: () => void
}) {
  const colors = useThemeColors()
  const bounce = useSharedValue(1)

  /** 1 khi viên nằm đúng tab này, giảm dần về 0 khi viên rời đi */
  const progress = (value: SharedValue<number>) => {
    'worklet'
    return interpolate(
      clampedPosition(value, count),
      [index - 1, index, index + 1],
      [0, 1, 0],
      Extrapolation.CLAMP,
    )
  }

  const tabStyle = useAnimatedStyle(() => ({ flexGrow: 1 + EXPAND * progress(position) }))
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: bounce.get() }] }))
  const activeIconStyle = useAnimatedStyle(() => ({ opacity: progress(position) }))
  const labelStyle = useAnimatedStyle(() => {
    const p = progress(position)
    return {
      maxWidth: p * LABEL_MAX_WIDTH,
      marginLeft: p * 6,
      opacity: p,
      transform: [{ translateX: (1 - p) * -6 }],
    }
  })

  const badge = options.tabBarBadge
  const icon = (color: string) => options.tabBarIcon?.({ focused, color, size: ICON_SIZE }) ?? null

  return (
    <Animated.View style={[{ flexBasis: 0 }, tabStyle]}>
      <Pressable
        role="tab"
        aria-selected={focused}
        aria-label={
          options.tabBarAccessibilityLabel ?? (badge != null ? `${label}, ${badge} mới` : label)
        }
        onPress={() => {
          bounce.set(
            withSequence(
              withTiming(0.8, { duration: 90 }),
              withSpring(1, { damping: 7, stiffness: 320 }),
            ),
          )
          onPress()
        }}
        onLongPress={onLongPress}
        className="flex-1 flex-row items-center justify-center overflow-hidden rounded-full px-2"
      >
        <Animated.View style={iconStyle}>
          <View style={{ width: ICON_SIZE, height: ICON_SIZE }}>
            {icon(colors.mutedForeground)}
            {/* Icon màu chữ trên viên hiện dần đè lên icon thường khi viên tới */}
            <Animated.View style={[{ position: 'absolute', inset: 0 }, activeIconStyle]}>
              {icon(colors.primaryForeground)}
            </Animated.View>
          </View>
          {badge != null && (
            <Animated.View
              key={String(badge)}
              entering={ZoomIn.springify()}
              style={{ position: 'absolute', top: -6, right: -10 }}
            >
              <View className="h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-card bg-neon px-1">
                <Text
                  maxFontSizeMultiplier={1.2}
                  className="font-sans-semibold text-[10px] leading-[12px] text-primary-foreground"
                >
                  {typeof badge === 'number' && badge > 99 ? '99+' : badge}
                </Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>
        <Animated.View style={[{ overflow: 'hidden' }, labelStyle]}>
          <Text
            numberOfLines={1}
            ellipsizeMode="clip"
            maxFontSizeMultiplier={1.2}
            className="font-sans-semibold text-sm text-primary-foreground"
          >
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}
