import type { BatteryOptionId, BatteryProblemId } from '@/features/services/battery/types';
import type { DiagnosticsProblemId } from '@/features/services/diagnostics/types';
import type { KeysProblemId } from '@/features/services/keys/types';

import { getServiceCatalog } from './services';
import type {
  ApiService,
  ApiServiceProblem,
  BackendServiceCode,
  FrontendServiceId,
} from './types';

export const FRONTEND_SERVICE_TO_BACKEND: Record<
  FrontendServiceId,
  BackendServiceCode
> = {
  battery: 'BATTERY',
  diagnostics: 'DIAGNOSTICS',
  keys: 'AUTO_KEY',
};

export const BATTERY_PROBLEM_TO_BACKEND: Record<BatteryProblemId, string> = {
  dead: 'DEAD_BATTERY',
  wont_start: 'WONT_START',
  warning: 'WEAK_BATTERY',
  unsure: 'NOT_SURE',
};

export const DIAGNOSTICS_PROBLEM_TO_BACKEND: Record<DiagnosticsProblemId, string> = {
  check_engine: 'CHECK_ENGINE',
  running_poorly: 'RUNNING_POORLY',
  pre_trip: 'PRE_TRIP',
  unsure: 'NOT_SURE',
};

export const KEYS_PROBLEM_TO_BACKEND: Record<KeysProblemId, string> = {
  locked_out: 'LOCKED_OUT',
  lost: 'LOST_KEY',
  not_working: 'KEY_NOT_WORKING',
  other: 'OTHER',
};

/**
 * Battery replacement is a frontend *option*, and a backend *problem* code
 * (BATTERY_REPLACEMENT → 60.00 GEL). Jump-start uses the selected problem.
 */
export function resolveBatteryProblemCode(
  problemId: BatteryProblemId,
  optionId: BatteryOptionId | null,
): string {
  if (optionId === 'replacement') return 'BATTERY_REPLACEMENT';
  return BATTERY_PROBLEM_TO_BACKEND[problemId];
}

export function resolveDiagnosticsProblemCode(
  problemId: DiagnosticsProblemId,
): string {
  return DIAGNOSTICS_PROBLEM_TO_BACKEND[problemId];
}

export function resolveKeysProblemCode(problemId: KeysProblemId): string {
  return KEYS_PROBLEM_TO_BACKEND[problemId];
}

export async function resolveCatalogIds(args: {
  frontendServiceId: FrontendServiceId;
  problemCode: string;
}): Promise<{ service: ApiService; problem: ApiServiceProblem }> {
  const serviceCode = FRONTEND_SERVICE_TO_BACKEND[args.frontendServiceId];
  const catalog = await getServiceCatalog();
  const service = catalog.find((item) => item.code === serviceCode);
  if (!service) {
    throw new Error(`Service ${serviceCode} was not found in the backend catalog.`);
  }
  const problem = service.problems.find((item) => item.code === args.problemCode);
  if (!problem) {
    throw new Error(
      `Problem ${args.problemCode} was not found on service ${serviceCode}.`,
    );
  }
  return { service, problem };
}
