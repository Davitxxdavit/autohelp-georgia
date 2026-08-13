/**
 * AutoHelp color tokens — starting palette, not final branding.
 * Change values here; components should consume semantic tokens only.
 */
export const colors = {
  background: '#080C10',
  surface: '#10161D',
  surfaceElevated: '#151D26',

  textPrimary: '#F5F7FA',
  textSecondary: '#A5AFBA',
  textMuted: '#6F7B87',

  border: '#202A34',
  borderSubtle: '#182028',

  /** Warm signal amber — automotive, premium, not purple. */
  primary: '#FF8C3A',
  primaryMuted: '#C46A28',
  primarySoft: 'rgba(255, 140, 58, 0.16)',
  onPrimary: '#0B0E12',

  success: '#20C77A',
  successSoft: 'rgba(32, 199, 122, 0.16)',
  warning: '#F2B84B',
  warningSoft: 'rgba(242, 184, 75, 0.16)',
  danger: '#EF5B5B',
  dangerSoft: 'rgba(239, 91, 91, 0.16)',

  overlay: 'rgba(8, 12, 16, 0.72)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorToken = keyof typeof colors;
