export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'server'
  | 'http';

export class ApiError extends Error {
  readonly status: number | null;
  readonly body: unknown;
  readonly fieldErrors: Record<string, string[]>;
  readonly kind: ApiErrorKind;

  constructor(args: {
    message: string;
    status: number | null;
    body?: unknown;
    kind?: ApiErrorKind;
  }) {
    super(args.message);
    this.name = 'ApiError';
    this.status = args.status;
    this.body = args.body ?? null;
    this.fieldErrors = extractFieldErrors(args.body);
    this.kind = args.kind ?? kindFromStatus(args.status);
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export function kindFromStatus(status: number | null): ApiErrorKind {
  if (status === null) return 'network';
  if (status === 400) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status >= 500) return 'server';
  return 'http';
}

export function extractFieldErrors(body: unknown): Record<string, string[]> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (key === 'detail' || key === 'code') continue;
    const messages = asStringArray(value);
    if (messages.length > 0) result[key] = messages;
  }
  return result;
}

export function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim()) return body;
  if (!body || typeof body !== 'object') return fallback;
  const record = body as Record<string, unknown>;
  if (typeof record.detail === 'string' && record.detail.trim()) {
    return record.detail;
  }
  const fields = extractFieldErrors(body);
  const first = Object.values(fields)[0]?.[0];
  return first ?? fallback;
}

function asStringArray(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [value];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}
