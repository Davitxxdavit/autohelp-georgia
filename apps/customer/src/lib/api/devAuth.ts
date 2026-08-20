import { obtainTokenPair } from './auth';
import { isApiConfigured } from './config';
import { getAccessToken, setTokenPair } from './tokens';

/**
 * DEVELOPMENT ONLY.
 *
 * Obtains JWT via phone + password so the Customer app can call the Django API.
 * Production authentication will use phone OTP. Do not treat this as product auth.
 *
 * Credentials come from EXPO_PUBLIC_DEV_PHONE / EXPO_PUBLIC_DEV_PASSWORD.
 */
export async function obtainDevelopmentJwt(): Promise<boolean> {
  if (!__DEV__) return false;

  if (await getAccessToken()) return true;

  if (!isApiConfigured()) {
    console.warn(
      '[AutoHelp DEV] JWT skipped: set EXPO_PUBLIC_API_URL (Android Emulator: http://10.0.2.2:8000/api/v1).',
    );
    return false;
  }

  const phone = process.env.EXPO_PUBLIC_DEV_PHONE?.trim();
  const password = process.env.EXPO_PUBLIC_DEV_PASSWORD;

  if (!phone || !password) {
    console.warn(
      '[AutoHelp DEV] JWT skipped: set EXPO_PUBLIC_DEV_PHONE and EXPO_PUBLIC_DEV_PASSWORD.',
    );
    return false;
  }

  try {
    const tokens = await obtainTokenPair({ phone, password });
    await setTokenPair(tokens);
    return true;
  } catch (error) {
    console.warn('[AutoHelp DEV] JWT obtain failed', error);
    return false;
  }
}
