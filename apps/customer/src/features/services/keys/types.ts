import type {
  MockLocation,
  ServiceRating,
} from '@/features/services/flow/types';

export const KEYS_SERVICE_ID = 'keys' as const;

export const KEYS_PROBLEM_IDS = [
  'locked_out',
  'lost',
  'not_working',
  'other',
] as const;
export type KeysProblemId = (typeof KEYS_PROBLEM_IDS)[number];

export type KeysProblem = {
  id: KeysProblemId;
  title: string;
  emoji: string;
};

export type KeysRating = ServiceRating;

export type KeysDraft = {
  vehicleId: string | null;
  problemId: KeysProblemId | null;
  details: string;
  location: MockLocation;
  requestedAt: string | null;
  completedAt: string | null;
  rating: KeysRating | null;
};
