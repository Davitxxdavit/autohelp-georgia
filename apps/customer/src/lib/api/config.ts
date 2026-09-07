/**
 * API base URL is configured only through EXPO_PUBLIC_API_URL.
 * Do not hardcode 10.0.2.2 / LAN IPs in application screens.
 *
 * Android Emulator:  http://10.0.2.2:8000/api/v1
 * Windows host:      http://127.0.0.1:8000/api/v1
 * Physical device:   http://<LAN-IP>:8000/api/v1
 * iOS Simulator:     http://127.0.0.1:8000/api/v1
 * Hosted staging:    https://autohelp-api.onrender.com/api/v1
 */
export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';
  return raw.replace(/\/+$/, '');
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}

export function requireApiBaseUrl(): string {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is not set. Copy apps/customer/.env.example to .env. ' +
        'Android Emulator must use http://10.0.2.2:8000/api/v1 (not 127.0.0.1).',
    );
  }
  return base;
}

export function joinApiUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  const base = requireApiBaseUrl();
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}
