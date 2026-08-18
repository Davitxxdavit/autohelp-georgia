import { withTiming, type SharedValue } from 'react-native-reanimated';

import { timing } from './timing';

export function runPressScale(
  scale: SharedValue<number>,
  pressed: boolean,
  reducedMotion = false,
): void {
  const target = pressed ? 0.97 : 1;
  if (reducedMotion) {
    scale.value = target;
    return;
  }
  scale.value = withTiming(target, { duration: timing.instant });
}
