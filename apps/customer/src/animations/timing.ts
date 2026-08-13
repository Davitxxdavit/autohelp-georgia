/**
 * Shared motion timing — deliberate, premium, not twitchy.
 */
export const timing = {
  instant: 100,
  fast: 160,
  normal: 240,
  slow: 360,
  entrance: 520,
  launch: 2200,
  launchMin: 1800,
  launchMax: 2500,
} as const;

/** Easing curve names mapped conceptually for presets */
export const motionCurves = {
  /** Soft settle into place */
  standard: 'standard' as const,
  /** Emphasized entrance */
  entrance: 'entrance' as const,
  /** Quick press feedback */
  press: 'press' as const,
  /** Exit / dismiss */
  exit: 'exit' as const,
};

export type TimingToken = keyof typeof timing;
