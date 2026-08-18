import { forwardRef, type ReactNode } from 'react';
import {
  Pressable,
  type AccessibilityRole,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { runPressScale } from '@/animations/transitions';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export type AnimatedPressableProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  accessibilityRole?: AccessibilityRole;
};

export const AnimatedPressable = forwardRef<
  React.ComponentRef<typeof Pressable>,
  AnimatedPressableProps
>(function AnimatedPressable(
  {
    children,
    style,
    onPressIn,
    onPressOut,
    accessibilityLabel,
    accessibilityRole = 'button',
    disabled,
    ...rest
  },
  ref,
) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      ref={ref}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={[animatedStyle, style]}
      onPressIn={(event) => {
        runPressScale(scale, true, !!reducedMotion);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        runPressScale(scale, false, !!reducedMotion);
        onPressOut?.(event);
      }}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
});
