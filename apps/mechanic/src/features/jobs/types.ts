import type { ServiceId } from '@/constants/services';

export const JOB_STATUSES = [
  'ASSIGNED',
  'ACCEPTED',
  'ON_THE_WAY',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'DECLINED',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** Placeholder coords for a later Google Maps swap. Not live GPS. */
export type MockGeoPoint = {
  latitude: number;
  longitude: number;
};

export type JobEarning = {
  grossAmount: string;
  commissionAmount: string;
  netAmount: string;
  currency: string;
};

export type QuoteStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type MockJob = {
  id: string;
  requestId: string;
  serviceId: ServiceId;
  status: JobStatus;
  customerLabel: string;
  customerPhone?: string | null;
  vehicleTitle: string;
  vehicleYear: number;
  fuel: string;
  problem: string;
  locationLabel: string;
  customerLatitude: number | null;
  customerLongitude: number | null;
  estimatedPayoutGel: number;
  estimatedPayoutDisplay: string;
  finalPriceAmount: string | null;
  quoteStatus: QuoteStatus | string;
  priceConfirmedByCustomer: boolean;
  priceProposedAt: string | null;
  earning?: JobEarning | null;
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  ON_THE_WAY: 'On the way',
  ARRIVED: 'Arrived',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
};

export function vehicleLine(job: MockJob): string {
  return `${job.vehicleTitle} · ${job.vehicleYear}`;
}

export function vehicleDetail(job: MockJob): string {
  return `${job.vehicleTitle} · ${job.vehicleYear} · ${job.fuel}`;
}

/** Forward-only operational transitions after Accept. */
export const JOB_STATUS_TRANSITIONS: Partial<Record<JobStatus, JobStatus>> = {
  ACCEPTED: 'ON_THE_WAY',
  ON_THE_WAY: 'ARRIVED',
  ARRIVED: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
};

export const OPERATIONAL_JOB_STATUSES: readonly JobStatus[] = [
  'ASSIGNED',
  'ACCEPTED',
  'ON_THE_WAY',
  'ARRIVED',
  'IN_PROGRESS',
];
