import { DEFAULT_LANGUAGE, type LanguageId } from '@/constants/languages';

export type SessionSnapshot = {
  /** UI language. Fresh installs default to ka without confirming selection. */
  language: LanguageId;
  /** True only after the user confirms a language on the picker. */
  languageSelected: boolean;
  onboardingCompleted: boolean;
  authenticated: boolean;
  /** Last phone used for mock OTP flow (E.164-ish local format without +995) */
  phone: string | null;
};

export const EMPTY_SESSION: SessionSnapshot = {
  language: DEFAULT_LANGUAGE,
  languageSelected: false,
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
  // Strict flags only. A stored @autohelp/language value is not confirmation.
  if (!session.languageSelected) return '/(auth)/language';
  if (!session.onboardingCompleted) return '/(auth)/onboarding';
  if (!session.authenticated) return '/(auth)/login';
  return '/(app)/(tabs)';
}
