import AsyncStorage from '@react-native-async-storage/async-storage';

import { SESSION_STORAGE_KEYS } from '@/services/session/storage';

/**
 * DEV ONLY — clears AutoHelp first-launch / auth session keys.
 * Does NOT clear vehicles or request drafts.
 *
 * Usage:
 *   Profile → Development → Reset App Session (__DEV__ only)
 *   Long-press the AutoHelp label on Language or Login.
 *   Or:
 *     import { resetAppState } from '@/services/storage/reset';
 *     await resetAppState();
 */
export async function resetAppState(): Promise<void> {
  if (!__DEV__) {
    console.warn('[AutoHelp] resetAppState is disabled outside __DEV__');
    return;
  }

  await AsyncStorage.multiRemove([
    SESSION_STORAGE_KEYS.language,
    SESSION_STORAGE_KEYS.languageSelected,
    SESSION_STORAGE_KEYS.onboardingCompleted,
    SESSION_STORAGE_KEYS.authenticated,
    SESSION_STORAGE_KEYS.phone,
  ]);

  console.log(
    '[AutoHelp DEV] Cleared language / onboarding / mock auth session keys.',
  );
}
