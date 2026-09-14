import type { ApiVehicle } from '@/lib/api/types';

import { isFuelType, type Vehicle, type VehicleInput } from './types';

export function mapApiVehicleToUi(api: ApiVehicle): Vehicle {
  return {
    id: api.id,
    make: api.make,
    model: api.model,
    year: api.year,
    engine: api.engine?.trim() || undefined,
    fuel: isFuelType(api.fuel) ? api.fuel : 'petrol',
    nickname: api.nickname?.trim() || undefined,
    isPrimary: Boolean(api.is_primary),
    createdAt: api.created_at,
    licensePlate: api.license_plate || undefined,
    vin: api.vin,
  };
}

export function mapApiVehiclesToUi(apis: ApiVehicle[]): Vehicle[] {
  return apis.map(mapApiVehicleToUi);
}

export function toVehicleWritePayload(input: VehicleInput) {
  return {
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year,
    engine: input.engine?.trim() ?? '',
    fuel: input.fuel,
    nickname: input.nickname?.trim() ?? '',
    is_primary: Boolean(input.isPrimary),
  };
}
