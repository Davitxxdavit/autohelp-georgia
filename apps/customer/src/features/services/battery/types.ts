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

export type MockMoney = {
  /** Numeric amount in GEL — mock catalog, not a billed price */
  amountGel: number;
  /** Display string, e.g. "30 ₾" */
  display: string;
  source: 'mock';
};

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

export type MockGeoPoint = {
  latitude: number;
  longitude: number;
};

/** Replace with expo-location / reverse geocode later */
export type MockLocation = {
  id: string;
  label: string;
  city: string;
  country: string;
  point: MockGeoPoint;
  source: 'mock';
};

export type MockMechanic = {
  id: string;
  name: string;
  rating: number;
  verified: boolean;
  distanceKm: number;
  etaMinutes: number;
  source: 'mock';
};

export type BatteryRating = {
  overall: number;
  speed: number;
  price: number;
  quality: number;
  comment: string;
};

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
