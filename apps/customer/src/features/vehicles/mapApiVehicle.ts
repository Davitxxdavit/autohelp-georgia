import type { ApiVehicle } from '@/lib/api/types';

import type { VehicleUiMeta } from './localMeta';
import { isFuelType, type Vehicle, type VehicleInput } from './types';

export function mapApiVehicleToUi(
  api: ApiVehicle,
  meta: VehicleUiMeta,
  fallbackPrimaryId: string | null,
): Vehicle {
  const primaryId = meta.primaryId ?? fallbackPrimaryId;
  return {
    id: api.id,
    make: api.make,
    model: api.model,
    year: api.year,
    engine: api.engine?.trim() || undefined,
    fuel: isFuelType(api.fuel) ? api.fuel : 'petrol',
    nickname: meta.nicknames[api.id],
    isPrimary: primaryId === api.id,
    createdAt: api.created_at,
    licensePlate: api.license_plate || undefined,
    vin: api.vin,
  };
}

export function mapApiVehiclesToUi(
  apis: ApiVehicle[],
  meta: VehicleUiMeta,
): Vehicle[] {
  const fallbackPrimaryId = apis[0]?.id ?? null;
  const mapped = apis.map((item) =>
    mapApiVehicleToUi(item, meta, fallbackPrimaryId),
  );
  if (mapped.length === 0) return mapped;
  if (mapped.some((item) => item.isPrimary)) return mapped;
  return mapped.map((item, index) => ({
    ...item,
    isPrimary: index === 0,
  }));
}

export function toVehicleWritePayload(input: VehicleInput) {
  return {
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year,
    engine: input.engine?.trim() ?? '',
    fuel: input.fuel,
  };
}
