import type {
  BatteryOption,
  BatteryProblem,
  MockGeoPoint,
  MockLocation,
  MockMechanic,
} from './types';

export const MOCK_BATUMI_LOCATION: MockLocation = {
  id: 'loc_batumi_center',
  label: 'Batumi, Georgia',
  city: 'Batumi',
  country: 'Georgia',
  point: {
    latitude: 41.6168,
    longitude: 41.6367,
  },
  source: 'mock',
};

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

/** Offset from the customer pin — replace with live specialist coordinates. */
export const MOCK_MECHANIC_POINT: MockGeoPoint = {
  latitude: 41.6284,
  longitude: 41.6452,
};

export const SEARCH_DELAY_MS = 2400;

export function getBatteryOption(id: string): BatteryOption | undefined {
  return BATTERY_OPTIONS.find((item) => item.id === id);
}

export function getBatteryProblem(id: string): BatteryProblem | undefined {
  return BATTERY_PROBLEMS.find((item) => item.id === id);
}

export function formatEstimatedPrice(option: BatteryOption): string {
  if (option.estimatedNote) {
    return `From ${option.estimatedFrom.display} ${option.estimatedNote}`;
  }
  return `From ${option.estimatedFrom.display}`;
}
