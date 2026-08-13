import AsyncStorage from '@react-native-async-storage/async-storage';

import { LANGUAGE_IDS, type LanguageId } from '@/constants/languages';

import { EMPTY_SESSION, type SessionSnapshot } from './types';

const KEYS = {
  language: '@autohelp/language',
  onboardingCompleted: '@autohelp/onboardingCompleted',
  authenticated: '@autohelp/authenticated',
  phone: '@autohelp/phone',
} as const;

function parseLanguage(value: string | null): LanguageId | null {
  if (!value) return null;
  return (LANGUAGE_IDS as readonly string[]).includes(value)
    ? (value as LanguageId)
    : null;
}

export async function readSession(): Promise<SessionSnapshot> {
  const [language, onboarding, authenticated, phone] = await Promise.all([
    AsyncStorage.getItem(KEYS.language),
    AsyncStorage.getItem(KEYS.onboardingCompleted),
    AsyncStorage.getItem(KEYS.authenticated),
    AsyncStorage.getItem(KEYS.phone),
  ]);

  return {
    language: parseLanguage(language),
    onboardingCompleted: onboarding === 'true',
    authenticated: authenticated === 'true',
    phone,
  };
}

export async function writeLanguage(language: LanguageId): Promise<void> {
  await AsyncStorage.setItem(KEYS.language, language);
}

export async function writeOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(KEYS.onboardingCompleted, 'true');
}

/**
 * MOCK AUTH — persists a local session flag only.
 * Replace with real backend tokens later. Does not verify identity.
 */
export async function writeMockAuthenticated(phone: string): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.authenticated, 'true'],
    [KEYS.phone, phone],
  ]);
}

export async function clearMockAuthenticated(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.authenticated, KEYS.phone]);
}

export async function resetSessionForDev(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export { EMPTY_SESSION, KEYS as SESSION_STORAGE_KEYS };
