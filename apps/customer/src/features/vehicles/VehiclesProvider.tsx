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
  createVehicle as createApiVehicle,
  deleteVehicle as deleteApiVehicle,
  hasAccessToken,
  listVehicles as listApiVehicles,
  updateVehicle as updateApiVehicle,
} from '@/lib/api';

import { mapApiVehiclesToUi, toVehicleWritePayload } from './mapApiVehicle';
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

/**
 * When a JWT is present, vehicles (including nickname and primary) load from Django.
 * Without a token, the previous AsyncStorage mock list is kept.
 */
export function VehiclesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const refresh = useCallback(async () => {
    const tokenReady = await hasAccessToken();
    if (tokenReady) {
      const apis = await listApiVehicles();
      setVehicles(mapApiVehiclesToUi(apis));
      return;
    }
    setVehicles(await readVehicles());
  }, []);

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((error) => {
        console.warn('[AutoHelp] Vehicles load failed', error);
        if (mounted) setVehicles([]);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const add = useCallback(async (input: VehicleInput) => {
    if (await hasAccessToken()) {
      const created = await createApiVehicle(toVehicleWritePayload(input));
      const apis = await listApiVehicles();
      const next = mapApiVehiclesToUi(apis);
      setVehicles(next);
      return next.find((item) => item.id === created.id) ?? next[0]!;
    }
    const next = await addVehicle(input);
    setVehicles(next);
    return next[next.length - 1]!;
  }, []);

  const update = useCallback(async (id: string, input: VehicleInput) => {
    if (await hasAccessToken()) {
      await updateApiVehicle(id, toVehicleWritePayload(input));
      setVehicles(mapApiVehiclesToUi(await listApiVehicles()));
      return;
    }
    setVehicles(await updateVehicle(id, input));
  }, []);

  const remove = useCallback(async (id: string) => {
    if (await hasAccessToken()) {
      await deleteApiVehicle(id);
      setVehicles(mapApiVehiclesToUi(await listApiVehicles()));
      return;
    }
    setVehicles(await deleteVehicle(id));
  }, []);

  const setPrimary = useCallback(async (id: string) => {
    if (await hasAccessToken()) {
      await updateApiVehicle(id, { is_primary: true });
      setVehicles(mapApiVehiclesToUi(await listApiVehicles()));
      return;
    }
    setVehicles(await setPrimaryVehicle(id));
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
