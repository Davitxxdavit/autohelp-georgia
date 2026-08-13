import {
  cancelAnimation,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { presets, type MotionPresetName } from './presets';
import { timing } from './timing';

type AxisValues = {
  opacity?: SharedValue<number>;
  translateX?: SharedValue<number>;
  translateY?: SharedValue<number>;
  scale?: SharedValue<number>;
};

/**
 * Apply a named motion preset to shared values.
 * When `reducedMotion` is true, snaps to the end state without animating.
 */
export function runPreset(
  name: MotionPresetName,
  values: AxisValues,
  options?: { reducedMotion?: boolean; delayMs?: number },
): void {
  const preset = presets[name];
  const reduced = options?.reducedMotion ?? false;
  const delayMs = options?.delayMs ?? 0;

  const apply = (
    value: SharedValue<number> | undefined,
    from: number | undefined,
    to: number | undefined,
  ) => {
    if (!value || to === undefined) return;
    if (from !== undefined) {
      value.value = from;
    }
    if (reduced) {
      value.value = to;
      return;
    }
    const animation = withTiming(to, preset.config);
    value.value = delayMs > 0 ? withDelay(delayMs, animation) : animation;
  };

  apply(values.opacity, preset.from.opacity, preset.to.opacity);
  apply(values.translateX, preset.from.translateX, preset.to.translateX);
  apply(values.translateY, preset.from.translateY, preset.to.translateY);
  apply(values.scale, preset.from.scale, preset.to.scale);
}

/** One-shot press-in / press-out scale for interactive surfaces */
export function runPressScale(
  scale: SharedValue<number>,
  pressed: boolean,
  reducedMotion = false,
): void {
  const target = pressed ? presets.pressScale.to.scale! : presets.pressScale.from.scale!;
  if (reducedMotion) {
    scale.value = target;
    return;
  }
  scale.value = withTiming(target, presets.pressScale.config);
}

/** Gentle looping pulse — cancel with cancelAnimation when unmounting */
export function runSubtlePulse(
  scale: SharedValue<number>,
  reducedMotion = false,
): void {
  if (reducedMotion) {
    scale.value = 1;
    return;
  }
  const { config, to, from } = presets.subtlePulse;
  scale.value = withRepeat(
    withSequence(withTiming(to.scale!, config), withTiming(from.scale!, config)),
    -1,
    false,
  );
}

export function stopAnimation(value: SharedValue<number>): void {
  cancelAnimation(value);
}

/** Clamp launch duration into the product window */
export function clampLaunchDuration(durationMs?: number): number {
  const value = durationMs ?? timing.launch;
  return Math.min(timing.launchMax, Math.max(timing.launchMin, value));
}

export { timing, presets };
