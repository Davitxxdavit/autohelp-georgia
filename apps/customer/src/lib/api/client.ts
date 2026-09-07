import { joinApiUrl } from './config';
import { ApiError, kindFromStatus, messageFromBody } from './errors';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from './tokens';
import type { Paginated, TokenRefreshResponse } from './types';

type RequestOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  skipRefresh?: boolean;
  headers?: Record<string, string>;
};

let refreshInFlight: Promise<string | null> | null = null;
const unauthorizedListeners = new Set<() => void>();

export function subscribeUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

function notifyUnauthorized(): void {
  unauthorizedListeners.forEach((listener) => listener());
}

/** Render Free cold start can exceed 50s. Do not fail after a few seconds. */
const REQUEST_TIMEOUT_MS = 75_000;

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError')
  );
}

export async function apiRequest<T>(
  pathOrUrl: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    auth = true,
    skipRefresh = false,
    headers: extraHeaders,
  } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const access = await getAccessToken();
    if (access) {
      headers.Authorization = `Bearer ${access}`;
    }
  }

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    response = await fetch(joinApiUrl(pathOrUrl), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError({
        message:
          'The server is taking too long to respond. The first request after idle can take about a minute.',
        status: null,
        kind: 'timeout',
      });
    }
    throw new ApiError({
      message:
        error instanceof Error
          ? error.message
          : 'Network request failed',
      status: null,
      kind: 'network',
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (
    response.status === 401 &&
    auth &&
    !skipRefresh
  ) {
    const nextAccess = await refreshAccessTokenOnce();
    if (nextAccess) {
      return apiRequest<T>(pathOrUrl, { ...options, skipRefresh: true });
    }
    await clearTokens();
    notifyUnauthorized();
    const bodyJson = await readBody(response);
    throw new ApiError({
      message: messageFromBody(bodyJson, 'Session expired. Sign in again.'),
      status: 401,
      body: bodyJson,
      kind: 'unauthorized',
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const parsed = await readBody(response);

  if (!response.ok) {
    throw new ApiError({
      message: messageFromBody(parsed, `Request failed (${response.status})`),
      status: response.status,
      body: parsed,
      kind: kindFromStatus(response.status),
    });
  }

  return parsed as T;
}

async function refreshAccessTokenOnce(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = await getRefreshToken();
    if (!refresh) return null;
    try {
      const data = await apiRequest<TokenRefreshResponse>('/auth/token/refresh/', {
        method: 'POST',
        body: { refresh },
        auth: false,
        skipRefresh: true,
      });
      await setAccessToken(data.access);
      return data.access;
    } catch {
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function unwrapList<T>(data: Paginated<T> | T[]): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function apiGetList<T>(
  path: string,
  options: { auth?: boolean } = {},
): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = path;
  const auth = options.auth ?? true;

  while (next) {
    const page: Paginated<T> | T[] = await apiRequest<Paginated<T> | T[]>(
      next,
      { auth },
    );
    if (Array.isArray(page)) {
      items.push(...page);
      break;
    }
    items.push(...(page.results ?? []));
    next = page.next;
  }

  return items;
}
