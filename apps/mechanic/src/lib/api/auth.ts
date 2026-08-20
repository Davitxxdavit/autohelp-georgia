import { apiRequest } from './client';
import type { TokenPair } from './types';

export async function obtainTokenPair(payload: {
  phone: string;
  password: string;
}): Promise<TokenPair> {
  return apiRequest<TokenPair>('/auth/token/', {
    method: 'POST',
    body: payload,
    auth: false,
    skipRefresh: true,
  });
}
