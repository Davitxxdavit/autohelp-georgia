import type {
  MockLocation,
  MockMoney,
  ServiceRating,
} from '@/features/services/flow/types';

export const BATTERY_SERVICE_ID = 'battery' as const;

export const BATTERY_OPTION_IDS = ['jump_start', 'replacement'] as const;
export type BatteryOptionId = (typeof BATTERY_OPTION_IDS)[number];

export const BATTERY_PROBLEM_IDS = [
  'dead',
  'wont_start',
  'warning',
  'unsure',
] as const;
export type BatteryProblemId = (typeof BATTERY_PROBLEM_IDS)[number];

export type {
  MockGeoPoint,
  MockLocation,
  MockMechanic,
  MockMoney,
  ServiceRating,
} from '@/features/services/flow/types';

export type BatteryOption = {
  id: BatteryOptionId;
  title: string;
  subtitle: string;
  estimatedFrom: MockMoney;
  estimatedNote?: string;
};

export type BatteryProblem = {
  id: BatteryProblemId;
  title: string;
  emoji: string;
};

export type BatteryRating = ServiceRating;

export type BatteryDraft = {
  optionId: BatteryOptionId | null;
  vehicleId: string | null;
  problemId: BatteryProblemId | null;
  details: string;
  location: MockLocation;
  requestedAt: string | null;
  completedAt: string | null;
  rating: BatteryRating | null;
};
