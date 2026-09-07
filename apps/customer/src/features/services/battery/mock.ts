import { MOCK_SPECIALIST_POINT } from '@/features/services/flow/location';
import { formatEstimatedPrice as formatServicePrice } from '@/features/services/flow/pricing';
import type { MockMechanic } from '@/features/services/flow/types';

import type { BatteryOption, BatteryProblem } from './types';

export { SEARCH_DELAY_MS } from '@/features/services/flow/location';

export const MOCK_MECHANIC_POINT = MOCK_SPECIALIST_POINT;

export const BATTERY_OPTIONS: BatteryOption[] = [
  {
    id: 'jump_start',
    title: 'Jump start',
    subtitle: 'Get the engine running again',
    estimatedFrom: {
      amountGel: 30,
      display: '30 ₾',
      source: 'mock',
    },
  },
  {
    id: 'replacement',
    title: 'Battery replacement',
    subtitle: 'Install a new battery on site',
    estimatedFrom: {
      amountGel: 60,
      display: '60 ₾',
      source: 'mock',
    },
    estimatedNote: '+ battery',
  },
];

export const BATTERY_PROBLEMS: BatteryProblem[] = [
  { id: 'dead', title: 'Battery is dead', emoji: '🔋' },
  { id: 'wont_start', title: "Car won't start", emoji: '🚗' },
  { id: 'warning', title: 'Battery warning appeared', emoji: '⚡' },
  { id: 'unsure', title: "I'm not sure", emoji: '❓' },
];

export const MOCK_MECHANIC: MockMechanic = {
  id: 'mech_giorgi',
  name: 'გიორგი',
  rating: 4.9,
  verified: true,
  distanceKm: 2.3,
  etaMinutes: 7,
  source: 'mock',
};

export function getBatteryOption(id: string): BatteryOption | undefined {
  return BATTERY_OPTIONS.find((item) => item.id === id);
}

export function getBatteryProblem(id: string): BatteryProblem | undefined {
  return BATTERY_PROBLEMS.find((item) => item.id === id);
}

export function formatEstimatedPrice(option: BatteryOption): string {
  return formatServicePrice(option);
}
