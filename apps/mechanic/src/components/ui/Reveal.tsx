import { type ReactNode, useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { timing } from '@/animations/timing';

export function Reveal({
  delayMs = 0,
  children,
}: {
  delayMs?: number;
  children: ReactNode;
}) {
  const reducedMotion = !!useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 12);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = withDelay(delayMs, withTiming(1, { duration: timing.slow }));
    translateY.value = withDelay(delayMs, withTiming(0, { duration: timing.slow }));
  }, [delayMs, opacity, reducedMotion, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
