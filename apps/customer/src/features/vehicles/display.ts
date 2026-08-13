import type { FuelType, Vehicle } from './types';

const FUEL_LABELS: Record<FuelType, string> = {
  petrol: 'ბენზინი',
  diesel: 'დიზელი',
  hybrid: 'ჰიბრიდი',
  electric: 'ელექტრო',
};

export function fuelLabel(fuel: FuelType): string {
  return FUEL_LABELS[fuel];
}

export function vehicleTitle(vehicle: Vehicle): string {
  if (vehicle.nickname?.trim()) return vehicle.nickname.trim();
  return `${vehicle.make} ${vehicle.model}`.trim();
}

export function vehicleSubtitle(vehicle: Vehicle): string {
  const parts = [
    String(vehicle.year),
    vehicle.engine?.trim() || undefined,
    fuelLabel(vehicle.fuel),
  ].filter(Boolean);
  return parts.join(' · ');
}

export const CURRENT_YEAR = new Date().getFullYear();
export const MIN_VEHICLE_YEAR = 1980;
