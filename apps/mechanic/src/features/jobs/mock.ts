import type { MockGeoPoint, MockJob } from './types';

/** Batumi mock pins — visual only until Google Maps is wired. */
export const MOCK_CUSTOMER_POINT: MockGeoPoint = {
  latitude: 41.6168,
  longitude: 41.6367,
};

export const MOCK_MECHANIC_START_POINT: MockGeoPoint = {
  latitude: 41.6312,
  longitude: 41.6194,
};

export const MOCK_BATTERY_JOB: MockJob = {
  id: 'job_battery_001',
  requestId: 'req_battery_001',
  serviceId: 'BATTERY',
  status: 'ASSIGNED',
  customerLabel: 'ნიკა',
  vehicleTitle: 'BMW i8',
  vehicleYear: 2015,
  fuel: 'Hybrid',
  problem: 'Battery is dead',
  locationLabel: 'Batumi, Georgia',
  customerLatitude: 41.6168,
  customerLongitude: 41.6367,
  estimatedPayoutGel: 30,
  estimatedPayoutDisplay: '30 GEL',
  finalPriceAmount: '30.00',
  quoteStatus: 'APPROVED',
  priceConfirmedByCustomer: true,
  priceProposedAt: null,
};

export function cloneJob(
  job: MockJob,
  status: MockJob['status'] = job.status,
): MockJob {
  return { ...job, status };
}
