import { apiGetList, apiRequest } from './client';
import type { ApiServiceRequest, CreateServiceRequestBody } from './types';

export async function listServiceRequests(): Promise<ApiServiceRequest[]> {
  return apiGetList<ApiServiceRequest>('/requests/');
}

export async function getServiceRequest(id: string): Promise<ApiServiceRequest> {
  return apiRequest<ApiServiceRequest>(`/requests/${id}/`);
}

export async function createServiceRequest(
  payload: CreateServiceRequestBody,
): Promise<ApiServiceRequest> {
  return apiRequest<ApiServiceRequest>('/requests/', {
    method: 'POST',
    body: payload,
  });
}
