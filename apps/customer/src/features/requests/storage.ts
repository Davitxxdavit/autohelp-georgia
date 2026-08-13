import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ServiceId } from '@/constants/services';
import { isServiceId } from '@/constants/services';

import type { RequestDraftInput, ServiceRequest } from './types';

const STORAGE_KEY = '@autohelp/requests';
const LATEST_KEY = '@autohelp/requests/latestId';

function createId(): string {
  return `rq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitize(raw: unknown): ServiceRequest | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<ServiceRequest>;
  if (
    typeof value.id !== 'string' ||
    typeof value.vehicleId !== 'string' ||
    typeof value.serviceId !== 'string' ||
    !isServiceId(value.serviceId) ||
    typeof value.details !== 'string' ||
    typeof value.locationLabel !== 'string' ||
    typeof value.estimatedPriceLabel !== 'string' ||
    value.status !== 'draft' ||
    typeof value.createdAt !== 'string'
  ) {
    return null;
  }
  return {
    id: value.id,
    vehicleId: value.vehicleId,
    serviceId: value.serviceId as ServiceId,
    details: value.details,
    locationLabel: value.locationLabel,
    estimatedPriceLabel: value.estimatedPriceLabel,
    status: 'draft',
    createdAt: value.createdAt,
  };
}

export async function readRequests(): Promise<ServiceRequest[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitize)
      .filter((item): item is ServiceRequest => item !== null);
  } catch {
    return [];
  }
}

/**
 * MOCK — stores a local draft request only. No backend / mechanic matching.
 */
export async function createDraftRequest(
  input: RequestDraftInput,
): Promise<ServiceRequest> {
  const request: ServiceRequest = {
    id: createId(),
    vehicleId: input.vehicleId,
    serviceId: input.serviceId,
    details: input.details,
    locationLabel: input.locationLabel,
    estimatedPriceLabel: input.estimatedPriceLabel,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };

  const current = await readRequests();
  const next = [request, ...current];
  await AsyncStorage.multiSet([
    [STORAGE_KEY, JSON.stringify(next)],
    [LATEST_KEY, request.id],
  ]);
  return request;
}

export async function readLatestRequestId(): Promise<string | null> {
  return AsyncStorage.getItem(LATEST_KEY);
}

export { STORAGE_KEY as REQUESTS_STORAGE_KEY };
