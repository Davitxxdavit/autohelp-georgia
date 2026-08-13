import type { LanguageId } from '@/constants/languages';

export type SessionSnapshot = {
  language: LanguageId | null;
  onboardingCompleted: boolean;
  authenticated: boolean;
  /** Last phone used for mock OTP flow (E.164-ish local format without +995) */
  phone: string | null;
};

export const EMPTY_SESSION: SessionSnapshot = {
  language: null,
  onboardingCompleted: false,
  authenticated: false,
  phone: null,
};

export type SessionDestination =
  | '/(auth)/language'
  | '/(auth)/onboarding'
  | '/(auth)/login'
  | '/(app)/(tabs)';

export function resolveSessionDestination(
  session: SessionSnapshot,
): SessionDestination {
  // Language is always first — never skip when unset, even if other flags are true.
  if (!session.language) return '/(auth)/language';
  if (!session.onboardingCompleted) return '/(auth)/onboarding';
  if (!session.authenticated) return '/(auth)/login';
  return '/(app)/(tabs)';
}
