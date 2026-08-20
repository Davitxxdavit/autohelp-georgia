export const FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'electric'] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  engine?: string;
  fuel: FuelType;
  nickname?: string;
  isPrimary: boolean;
  createdAt: string;
  /** Backend field; optional in UI for now. */
  licensePlate?: string;
  /** Backend field; optional in UI for now. */
  vin?: string | null;
};

export type VehicleInput = {
  make: string;
  model: string;
  year: number;
  engine?: string;
  fuel: FuelType;
  nickname?: string;
  isPrimary?: boolean;
};

export function isFuelType(value: string): value is FuelType {
  return (FUEL_TYPES as readonly string[]).includes(value);
}
