import { formatEstimatedPrice as formatServicePrice } from '@/features/services/flow/pricing';

import type { DiagnosticsOption, DiagnosticsProblem } from './types';

export const DIAGNOSTICS_OPTIONS: DiagnosticsOption[] = [
  {
    id: 'onsite',
    title: 'On-site computer diagnostics',
    subtitle: 'Scan warning lights and engine systems',
    estimatedFrom: {
      amountGel: 50,
      display: '50 ₾',
      source: 'mock',
    },
  },
];

export const DIAGNOSTICS_PROBLEMS: DiagnosticsProblem[] = [
  { id: 'check_engine', title: 'Check engine light', emoji: '💡' },
  { id: 'running_poorly', title: 'Car running poorly', emoji: '🚗' },
  { id: 'pre_trip', title: 'Pre-trip check', emoji: '🧭' },
  { id: 'unsure', title: "I'm not sure", emoji: '❓' },
];

export function getDiagnosticsOption(id: string): DiagnosticsOption | undefined {
  return DIAGNOSTICS_OPTIONS.find((item) => item.id === id);
}

export function getDiagnosticsProblem(
  id: string,
): DiagnosticsProblem | undefined {
  return DIAGNOSTICS_PROBLEMS.find((item) => item.id === id);
}

export function formatEstimatedPrice(option: DiagnosticsOption): string {
  return formatServicePrice(option);
}
