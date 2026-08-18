export const SERVICE_IDS = ['BATTERY', 'DIAGNOSTICS', 'AUTO_KEY'] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export const SERVICE_LABELS: Record<ServiceId, string> = {
  BATTERY: 'Battery Assistance',
  DIAGNOSTICS: 'Diagnostics',
  AUTO_KEY: 'Auto Key',
};
