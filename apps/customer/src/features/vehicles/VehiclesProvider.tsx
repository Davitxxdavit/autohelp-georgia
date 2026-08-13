import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  addVehicle,
  deleteVehicle,
  readVehicles,
  setPrimaryVehicle,
  updateVehicle,
} from './storage';
import type { Vehicle, VehicleInput } from './types';

type VehiclesContextValue = {
  ready: boolean;
  vehicles: Vehicle[];
  primaryVehicle: Vehicle | null;
  refresh: () => Promise<void>;
  add: (input: VehicleInput) => Promise<Vehicle>;
  update: (id: string, input: VehicleInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setPrimary: (id: string) => Promise<void>;
  getById: (id: string) => Vehicle | undefined;
};

const VehiclesContext = createContext<VehiclesContextValue | null>(null);

export function VehiclesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const refresh = useCallback(async () => {
    const next = await readVehicles();
    setVehicles(next);
  }, []);

  useEffect(() => {
    let mounted = true;
    readVehicles()
      .then((next) => {
        if (mounted) {
          setVehicles(next);
          setReady(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setVehicles([]);
          setReady(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const add = useCallback(async (input: VehicleInput) => {
    const next = await addVehicle(input);
    setVehicles(next);
    return next[next.length - 1]!;
  }, []);

  const update = useCallback(async (id: string, input: VehicleInput) => {
    const next = await updateVehicle(id, input);
    setVehicles(next);
  }, []);

  const remove = useCallback(async (id: string) => {
    const next = await deleteVehicle(id);
    setVehicles(next);
  }, []);

  const setPrimary = useCallback(async (id: string) => {
    const next = await setPrimaryVehicle(id);
    setVehicles(next);
  }, []);

  const getById = useCallback(
    (id: string) => vehicles.find((vehicle) => vehicle.id === id),
    [vehicles],
  );

  const value = useMemo<VehiclesContextValue>(
    () => ({
      ready,
      vehicles,
      primaryVehicle: vehicles.find((vehicle) => vehicle.isPrimary) ?? null,
      refresh,
      add,
      update,
      remove,
      setPrimary,
      getById,
    }),
    [ready, vehicles, refresh, add, update, remove, setPrimary, getById],
  );

  return (
    <VehiclesContext.Provider value={value}>{children}</VehiclesContext.Provider>
  );
}

export function useVehicles(): VehiclesContextValue {
  const ctx = useContext(VehiclesContext);
  if (!ctx) {
    throw new Error('useVehicles must be used within VehiclesProvider');
  }
  return ctx;
}
