import { apiGetList, apiRequest } from './client';
import type { ApiMechanicOffer } from './types';

export async function listPendingOffers(): Promise<ApiMechanicOffer[]> {
  return apiGetList<ApiMechanicOffer>('/mechanic/offers/');
}

export async function getActiveJob(): Promise<ApiMechanicOffer | null> {
  const data = await apiRequest<ApiMechanicOffer | undefined>(
    '/mechanic/jobs/active/',
  );
  return data ?? null;
}

export async function acceptOffer(offerId: string): Promise<ApiMechanicOffer> {
  return apiRequest<ApiMechanicOffer>(`/mechanic/offers/${offerId}/accept/`, {
    method: 'POST',
  });
}

export async function declineOffer(offerId: string): Promise<ApiMechanicOffer> {
  return apiRequest<ApiMechanicOffer>(`/mechanic/offers/${offerId}/decline/`, {
    method: 'POST',
  });
}
