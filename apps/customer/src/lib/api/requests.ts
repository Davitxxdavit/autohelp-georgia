import { apiGetList, apiRequest } from './client';
import { resolveCatalogIds } from './mapping';
import type {
  ApiServiceRequest,
  CreateServiceRequestBody,
  FrontendServiceId,
  Paginated,
} from './types';

export async function listServiceRequests(): Promise<ApiServiceRequest[]> {
  return apiGetList<ApiServiceRequest>('/requests/');
}

export async function getServiceRequest(id: string): Promise<ApiServiceRequest> {
  return apiRequest<ApiServiceRequest>(`/requests/${id}/`);
}

/** Django DecimalField max_digits validation: 6 decimal places. Numeric, not a locale string. */
function toApiCoordinate(value: number | string): number {
  return Number(Number(value).toFixed(6));
}

export async function createServiceRequest(
  payload: CreateServiceRequestBody,
): Promise<ApiServiceRequest> {
  return apiRequest<ApiServiceRequest>('/requests/', {
    method: 'POST',
    body: {
      ...payload,
      customer_latitude: toApiCoordinate(payload.customer_latitude),
      customer_longitude: toApiCoordinate(payload.customer_longitude),
    },
  });
}

/** First page only. Orders does not need infinite scroll in this milestone. */
export async function listServiceRequestsFirstPage(): Promise<
  ApiServiceRequest[]
> {
  const page = await apiRequest<
    Paginated<ApiServiceRequest> | ApiServiceRequest[]
  >('/requests/');
  if (Array.isArray(page)) return page;
  return page.results ?? [];
}

/**
 * Shared create path for Battery / Diagnostics / Auto Key.
 * Resolves catalog UUIDs by stable codes, then POSTs writable fields only.
 */
export async function createRoadsideRequest(args: {
  frontendServiceId: FrontendServiceId;
  problemCode: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  address: string;
}): Promise<ApiServiceRequest> {
  const { service, problem } = await resolveCatalogIds({
    frontendServiceId: args.frontendServiceId,
    problemCode: args.problemCode,
  });
  return createServiceRequest({
    vehicle: args.vehicleId,
    service: service.id,
    problem: problem.id,
    customer_latitude: args.latitude,
    customer_longitude: args.longitude,
    customer_address: args.address,
  });
}
