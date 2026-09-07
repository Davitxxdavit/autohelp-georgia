import { apiGetList, apiRequest } from './client';
import type { RegisterMechanicResponse, TokenPair } from './types';

export async function registerMechanic(payload: {
  phone: string;
  password: string;
  first_name: string;
  services: string[];
}): Promise<RegisterMechanicResponse> {
  return apiRequest<RegisterMechanicResponse>('/auth/mechanic/register/', {
    method: 'POST',
    body: payload,
    auth: false,
    skipRefresh: true,
  });
}

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
