import type { ApiServiceRequest } from '@/lib/api/types';
import type {
  MockLocation,
  MockMoney,
  ServiceRating,
} from '@/features/services/flow/types';

export const DIAGNOSTICS_SERVICE_ID = 'diagnostics' as const;

export const DIAGNOSTICS_OPTION_IDS = ['onsite'] as const;
export type DiagnosticsOptionId = (typeof DIAGNOSTICS_OPTION_IDS)[number];

export const DIAGNOSTICS_PROBLEM_IDS = [
  'check_engine',
  'running_poorly',
  'pre_trip',
  'unsure',
] as const;
export type DiagnosticsProblemId = (typeof DIAGNOSTICS_PROBLEM_IDS)[number];

export type DiagnosticsOption = {
  id: DiagnosticsOptionId;
  title: string;
  subtitle: string;
  estimatedFrom: MockMoney;
};

export type DiagnosticsProblem = {
  id: DiagnosticsProblemId;
  title: string;
  emoji: string;
};

export type DiagnosticsRating = ServiceRating;

export type DiagnosticsDraft = {
  optionId: DiagnosticsOptionId | null;
  vehicleId: string | null;
  problemId: DiagnosticsProblemId | null;
  details: string;
  location: MockLocation | null;
  requestedAt: string | null;
  completedAt: string | null;
  rating: DiagnosticsRating | null;
  serviceRequestId: string | null;
  backendEstimatedPriceAmount: string | null;
  backendEstimatedPriceCurrency: string | null;
  /** Latest GET /requests/{id}/ payload. Backend is source of truth. */
  liveRequest: ApiServiceRequest | null;
};
