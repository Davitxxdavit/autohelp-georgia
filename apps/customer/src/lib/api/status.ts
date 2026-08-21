import type { StatusTone } from '@/components/ui/StatusBadge';

import type { ApiRequestStatus } from './types';

export const REQUEST_STATUS_LABELS: Record<ApiRequestStatus, string> = {
  REQUESTED: 'Requested',
  SEARCHING: 'Searching',
  ASSIGNED: 'Mechanic assigned',
  ACCEPTED: 'Accepted',
  ON_THE_WAY: 'On the way',
  ARRIVED: 'Arrived',
  IN_PROGRESS: 'Service in progress',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};

export const ACTIVE_REQUEST_STATUSES: readonly ApiRequestStatus[] = [
  'REQUESTED',
  'SEARCHING',
  'ASSIGNED',
  'ACCEPTED',
  'ON_THE_WAY',
  'ARRIVED',
  'IN_PROGRESS',
];

export const HISTORY_REQUEST_STATUSES: readonly ApiRequestStatus[] = [
  'COMPLETED',
  'DECLINED',
  'CANCELLED',
];

const STATUS_TONES: Record<ApiRequestStatus, StatusTone> = {
  REQUESTED: 'primary',
  SEARCHING: 'primary',
  ASSIGNED: 'primary',
  ACCEPTED: 'primary',
  ON_THE_WAY: 'warning',
  ARRIVED: 'warning',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  DECLINED: 'danger',
  CANCELLED: 'danger',
};

export function isApiRequestStatus(value: string): value is ApiRequestStatus {
  return value in REQUEST_STATUS_LABELS;
}

export function requestStatusLabel(status: string): string {
  if (isApiRequestStatus(status)) return REQUEST_STATUS_LABELS[status];
  return status;
}

export function requestStatusTone(status: string): StatusTone {
  if (isApiRequestStatus(status)) return STATUS_TONES[status];
  return 'neutral';
}

export function isHistoryRequestStatus(status: string): boolean {
  return (HISTORY_REQUEST_STATUSES as readonly string[]).includes(status);
}

export function isActiveRequestStatus(status: string): boolean {
  return !isHistoryRequestStatus(status);
}

export function isTerminalRequestStatus(status: string): boolean {
  return (
    status === 'COMPLETED' ||
    status === 'CANCELLED' ||
    status === 'DECLINED'
  );
}

export const SERVICE_CODE_LABELS: Record<string, string> = {
  BATTERY: 'Battery Assistance',
  DIAGNOSTICS: 'Diagnostics',
  AUTO_KEY: 'Auto Key',
};

export function serviceCodeLabel(code: string): string {
  return SERVICE_CODE_LABELS[code] ?? code;
}

/** Never render null AUTO_KEY estimates as 0. */
export function formatRequestEstimate(
  amount: string | null,
  currency: string,
): string {
  if (amount == null || amount.trim() === '') {
    return 'Price to be confirmed';
  }
  const trimmed = amount.replace(/\.00$/, '');
  const suffix = currency === 'GEL' ? '₾' : currency;
  return `${trimmed} ${suffix}`;
}

export function formatRequestTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}
