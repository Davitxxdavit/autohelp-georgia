import { apiRequest } from './client';
import { isApiError } from './errors';

export async function createRating(payload: {
  request: string;
  stars: number;
  feedback?: string;
}): Promise<unknown> {
  return apiRequest('/ratings/', {
    method: 'POST',
    body: {
      request: payload.request,
      stars: payload.stars,
      feedback: payload.feedback?.trim() ? payload.feedback.trim() : undefined,
    },
  });
}

export function isDuplicateRatingError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  const haystack = [
    error.message,
    ...(error.fieldErrors.request ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes('already has a rating');
}
