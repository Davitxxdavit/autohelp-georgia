import { apiGetList, apiRequest } from './client';
import type {
  ApiMechanicEarningsResponse,
  ApiMechanicMe,
  ApiMechanicOffer,
  ApiTripRoute,
} from './types';

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

export async function proposeJobPrice(
  requestId: string,
  amount: string,
): Promise<ApiMechanicOffer> {
  return apiRequest<ApiMechanicOffer>(`/mechanic/jobs/${requestId}/price/`, {
    method: 'POST',
    body: { amount },
  });
}

export async function listMechanicEarnings(): Promise<ApiMechanicEarningsResponse> {
  return apiRequest<ApiMechanicEarningsResponse>('/mechanic/earnings/');
}

export async function reportMechanicLocation(body: {
  latitude: number;
  longitude: number;
}): Promise<{
  latitude: string;
  longitude: string;
  location_updated_at: string;
}> {
  return apiRequest('/mechanic/location/', {
    method: 'POST',
    body: {
      latitude: Number(body.latitude).toFixed(6),
      longitude: Number(body.longitude).toFixed(6),
    },
  });
}

export async function getRequestRoute(id: string): Promise<ApiTripRoute> {
  return apiRequest<ApiTripRoute>(`/requests/${id}/route/`);
}
