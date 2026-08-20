import { apiGetList, apiRequest } from './client';
import type { ApiMechanicMe, ApiMechanicOffer } from './types';

export type MechanicJobAction =
  | 'start-driving'
  | 'arrive'
  | 'start-service'
  | 'complete';

export async function getMechanicMe(): Promise<ApiMechanicMe> {
  return apiRequest<ApiMechanicMe>('/mechanic/me/');
}

export async function patchMechanicMe(body: {
  online: boolean;
}): Promise<ApiMechanicMe> {
  return apiRequest<ApiMechanicMe>('/mechanic/me/', {
    method: 'PATCH',
    body,
  });
}

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

export async function transitionJob(
  requestId: string,
  action: MechanicJobAction,
): Promise<ApiMechanicOffer> {
  return apiRequest<ApiMechanicOffer>(
    `/mechanic/jobs/${requestId}/${action}/`,
    { method: 'POST' },
  );
}
