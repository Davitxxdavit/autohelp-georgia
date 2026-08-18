import type { MockMechanic } from '@/features/services/flow/types';

import type { KeysProblem } from './types';

export { MOCK_BATUMI_LOCATION, SEARCH_DELAY_MS } from '@/features/services/flow/location';

export const KEYS_PROBLEMS: KeysProblem[] = [
  { id: 'locked_out', title: 'Locked out of my car', emoji: '🚪' },
  { id: 'lost', title: 'Lost my key', emoji: '🔑' },
  { id: 'not_working', title: 'Key is not working', emoji: '🪫' },
  { id: 'other', title: 'Other', emoji: '❓' },
];

export const MOCK_SPECIALIST: MockMechanic = {
  id: 'mech_levani',
  name: 'ლევანი',
  rating: 4.7,
  verified: true,
  distanceKm: 3.1,
  etaMinutes: 12,
  source: 'mock',
};

export const PRICE_CONFIRM_LATER = 'Price will be confirmed by the specialist';

export function getKeysProblem(id: string): KeysProblem | undefined {
  return KEYS_PROBLEMS.find((item) => item.id === id);
}
