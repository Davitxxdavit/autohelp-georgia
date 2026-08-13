import type { ServiceIconKind } from '@/components/automotive/ServiceIcon';
import type { ServiceId } from '@/constants/services';

/** Maps stable service IDs to Step 2 ServiceIcon glyphs */
export const SERVICE_ICON_KIND: Record<ServiceId, ServiceIconKind> = {
  battery: 'battery',
  fuel: 'fuel',
  mechanic: 'mechanic',
  diagnostics: 'diagnostics',
  tow: 'tow',
  keys: 'locksmith',
};
