import { apiRequest } from './client';
import type { CurrentUser, RegisterCustomerResponse, TokenPair } from './types';

export async function registerCustomer(payload: {
  phone: string;
  password: string;
  first_name: string;
}): Promise<RegisterCustomerResponse> {
  return apiRequest<RegisterCustomerResponse>('/auth/register/', {
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

export async function refreshTokenPair(refresh: string): Promise<{ access: string }> {
  return apiRequest<{ access: string }>('/auth/token/refresh/', {
    method: 'POST',
    body: { refresh },
    auth: false,
    skipRefresh: true,
  });
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/auth/me/');
}

export async function updateCurrentUser(payload: {
  first_name: string;
}): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/auth/me/', {
    method: 'PATCH',
    body: payload,
  });
}
