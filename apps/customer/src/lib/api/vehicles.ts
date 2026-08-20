import { apiGetList, apiRequest } from './client';
import type { ApiVehicle, ApiVehicleWrite } from './types';

export async function listVehicles(): Promise<ApiVehicle[]> {
  return apiGetList<ApiVehicle>('/vehicles/');
}

export async function createVehicle(payload: ApiVehicleWrite): Promise<ApiVehicle> {
  return apiRequest<ApiVehicle>('/vehicles/', {
    method: 'POST',
    body: payload,
  });
}

export async function updateVehicle(
  id: string,
  payload: Partial<ApiVehicleWrite>,
): Promise<ApiVehicle> {
  return apiRequest<ApiVehicle>(`/vehicles/${id}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiRequest<void>(`/vehicles/${id}/`, {
    method: 'DELETE',
  });
}
