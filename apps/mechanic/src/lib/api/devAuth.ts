import { obtainTokenPair } from './auth';
import { isApiConfigured } from './config';
import { getAccessToken, setTokenPair } from './tokens';

/**
 * DEVELOPMENT ONLY. Production mechanic auth will use phone OTP.
 */
export async function obtainDevelopmentJwt(): Promise<boolean> {
  if (!__DEV__) return false;
  if (await getAccessToken()) return true;
  if (!isApiConfigured()) {
    console.warn(
      '[AutoHelp Mechanic DEV] JWT skipped: set EXPO_PUBLIC_API_URL.',
    );
    return false;
  }
  const phone = process.env.EXPO_PUBLIC_DEV_PHONE?.trim();
  const password = process.env.EXPO_PUBLIC_DEV_PASSWORD;
  if (!phone || !password) {
    console.warn(
      '[AutoHelp Mechanic DEV] JWT skipped: set EXPO_PUBLIC_DEV_PHONE and EXPO_PUBLIC_DEV_PASSWORD.',
    );
    return false;
  }
  try {
    const tokens = await obtainTokenPair({ phone, password });
    await setTokenPair(tokens);
    return true;
  } catch (error) {
    console.warn('[AutoHelp Mechanic DEV] JWT obtain failed', error);
    return false;
  }
}
