import { SERVICE_IDS, type ServiceId } from '@/constants/services';
import type { ApiMechanicOffer } from '@/lib/api/types';

import { MOCK_BATTERY_JOB } from './mock';
import type { JobStatus, MockJob } from './types';

function asServiceId(code: string): ServiceId {
  if ((SERVICE_IDS as readonly string[]).includes(code)) {
    return code as ServiceId;
  }
  return 'BATTERY';
}

function formatCatalogEstimate(amount: string | null, currency: string): string {
  if (amount == null || amount.trim() === '') {
    return 'Price to be confirmed';
  }
  const trimmed = amount.replace(/\.00$/, '');
  const suffix = currency === 'GEL' ? '₾' : currency;
  return `${trimmed} ${suffix}`;
}

function fuelLabel(fuel: string): string {
  if (!fuel) return '';
  return fuel.charAt(0).toUpperCase() + fuel.slice(1);
}

/**
 * Maps a backend offer onto the existing MockJob UI shape.
 * distanceKm / etaMinutes stay visual placeholders (no routing engine).
 */
export function mapOfferToJob(
  offer: ApiMechanicOffer,
  status: JobStatus,
): MockJob {
  const request = offer.request;
  const vehicle = request.vehicle;
  const amount = request.estimated_price_amount;
  return {
    id: offer.id,
    serviceId: asServiceId(request.service_code),
    status,
    customerLabel: request.customer_display_name,
    vehicleTitle: `${vehicle.make} ${vehicle.model}`.trim(),
    vehicleYear: vehicle.year,
    fuel: fuelLabel(vehicle.fuel),
    problem: request.problem_label,
    locationLabel: request.customer_address || 'Batumi, Georgia',
    distanceKm: MOCK_BATTERY_JOB.distanceKm,
    etaMinutes: MOCK_BATTERY_JOB.etaMinutes,
    estimatedPayoutGel: amount ? Number.parseFloat(amount) : 0,
    estimatedPayoutDisplay: formatCatalogEstimate(
      amount,
      request.estimated_price_currency,
    ),
  };
}

export function jobStatusFromRequest(status: string): JobStatus {
  if (
    status === 'ACCEPTED' ||
    status === 'ON_THE_WAY' ||
    status === 'ARRIVED' ||
    status === 'IN_PROGRESS' ||
    status === 'COMPLETED' ||
    status === 'DECLINED' ||
    status === 'ASSIGNED'
  ) {
    return status;
  }
  return 'ASSIGNED';
}
