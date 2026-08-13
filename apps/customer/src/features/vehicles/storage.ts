import AsyncStorage from '@react-native-async-storage/async-storage';

import { isFuelType, type Vehicle, type VehicleInput } from './types';

const STORAGE_KEY = '@autohelp/vehicles';

function createId(): string {
  return `vh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeVehicle(raw: unknown): Vehicle | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<Vehicle>;
  if (
    typeof value.id !== 'string' ||
    typeof value.make !== 'string' ||
    typeof value.model !== 'string' ||
    typeof value.year !== 'number' ||
    typeof value.fuel !== 'string' ||
    !isFuelType(value.fuel) ||
    typeof value.isPrimary !== 'boolean' ||
    typeof value.createdAt !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    make: value.make,
    model: value.model,
    year: value.year,
    engine: typeof value.engine === 'string' ? value.engine : undefined,
    fuel: value.fuel,
    nickname: typeof value.nickname === 'string' ? value.nickname : undefined,
    isPrimary: value.isPrimary,
    createdAt: value.createdAt,
  };
}

export async function readVehicles(): Promise<Vehicle[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeVehicle)
      .filter((item): item is Vehicle => item !== null);
  } catch {
    return [];
  }
}

async function writeVehicles(vehicles: Vehicle[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
}

function ensurePrimary(vehicles: Vehicle[]): Vehicle[] {
  if (vehicles.length === 0) return vehicles;
  if (vehicles.some((vehicle) => vehicle.isPrimary)) return vehicles;
  return vehicles.map((vehicle, index) => ({
    ...vehicle,
    isPrimary: index === 0,
  }));
}

export async function addVehicle(input: VehicleInput): Promise<Vehicle[]> {
  const current = await readVehicles();
  const vehicle: Vehicle = {
    id: createId(),
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year,
    engine: input.engine?.trim() || undefined,
    fuel: input.fuel,
    nickname: input.nickname?.trim() || undefined,
    isPrimary: current.length === 0 ? true : Boolean(input.isPrimary),
    createdAt: new Date().toISOString(),
  };

  let next = [...current, vehicle];
  if (vehicle.isPrimary) {
    next = next.map((item) => ({
      ...item,
      isPrimary: item.id === vehicle.id,
    }));
  }

  next = ensurePrimary(next);
  await writeVehicles(next);
  return next;
}

export async function updateVehicle(
  id: string,
  input: VehicleInput,
): Promise<Vehicle[]> {
  const current = await readVehicles();
  let next = current.map((vehicle) => {
    if (vehicle.id !== id) return vehicle;
    return {
      ...vehicle,
      make: input.make.trim(),
      model: input.model.trim(),
      year: input.year,
      engine: input.engine?.trim() || undefined,
      fuel: input.fuel,
      nickname: input.nickname?.trim() || undefined,
      isPrimary: input.isPrimary ?? vehicle.isPrimary,
    };
  });

  if (input.isPrimary) {
    next = next.map((vehicle) => ({
      ...vehicle,
      isPrimary: vehicle.id === id,
    }));
  }

  next = ensurePrimary(next);
  await writeVehicles(next);
  return next;
}

export async function deleteVehicle(id: string): Promise<Vehicle[]> {
  const current = await readVehicles();
  const next = ensurePrimary(current.filter((vehicle) => vehicle.id !== id));
  await writeVehicles(next);
  return next;
}

export async function setPrimaryVehicle(id: string): Promise<Vehicle[]> {
  const current = await readVehicles();
  const next = current.map((vehicle) => ({
    ...vehicle,
    isPrimary: vehicle.id === id,
  }));
  await writeVehicles(ensurePrimary(next));
  return ensurePrimary(next);
}

export { STORAGE_KEY as VEHICLES_STORAGE_KEY };
