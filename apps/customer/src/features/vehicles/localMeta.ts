import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@autohelp/vehicle-ui-meta';

export type VehicleUiMeta = {
  primaryId: string | null;
  nicknames: Record<string, string>;
};

const EMPTY_META: VehicleUiMeta = {
  primaryId: null,
  nicknames: {},
};

export async function readVehicleUiMeta(): Promise<VehicleUiMeta> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...EMPTY_META, nicknames: {} };
  try {
    const parsed = JSON.parse(raw) as Partial<VehicleUiMeta>;
    return {
      primaryId: typeof parsed.primaryId === 'string' ? parsed.primaryId : null,
      nicknames:
        parsed.nicknames && typeof parsed.nicknames === 'object'
          ? parsed.nicknames
          : {},
    };
  } catch {
    return { ...EMPTY_META, nicknames: {} };
  }
}

export async function writeVehicleUiMeta(meta: VehicleUiMeta): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
}

export async function upsertVehicleUiMeta(args: {
  id: string;
  nickname?: string;
  isPrimary?: boolean;
}): Promise<VehicleUiMeta> {
  const current = await readVehicleUiMeta();
  const nicknames = { ...current.nicknames };
  const nickname = args.nickname?.trim();
  if (nickname) nicknames[args.id] = nickname;
  else delete nicknames[args.id];

  const next: VehicleUiMeta = {
    nicknames,
    primaryId: args.isPrimary ? args.id : current.primaryId,
  };
  await writeVehicleUiMeta(next);
  return next;
}

export async function removeVehicleUiMeta(id: string): Promise<VehicleUiMeta> {
  const current = await readVehicleUiMeta();
  const nicknames = { ...current.nicknames };
  delete nicknames[id];
  const next: VehicleUiMeta = {
    nicknames,
    primaryId: current.primaryId === id ? null : current.primaryId,
  };
  await writeVehicleUiMeta(next);
  return next;
}
