import { useEffect } from 'react';
import { type ReactNode } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { timing } from '@/animations/timing';

export function FadeIn({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 12);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const ease = Easing.bezier(0.16, 1, 0.3, 1);
    opacity.value = withTiming(1, { duration: timing.entrance, easing: ease });
    translateY.value = withTiming(0, { duration: timing.entrance, easing: ease });
  }, [opacity, reducedMotion, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
}
