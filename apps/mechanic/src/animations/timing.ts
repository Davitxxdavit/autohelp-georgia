export const timing = {
  instant: 100,
  fast: 160,
  normal: 240,
  slow: 360,
} as const;

export type TimingToken = keyof typeof timing;
