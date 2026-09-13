import { SERVICE_IDS, type ServiceId } from '@/constants/services';
import { parseGeoPoint } from '@/features/maps/geo';
import type { ApiMechanicOffer } from '@/lib/api/types';

import type { JobStatus, MockJob } from './types';

function asServiceId(code: string): ServiceId {
  if ((SERVICE_IDS as readonly string[]).includes(code)) {
    return code as ServiceId;
  }
  return 'BATTERY';
}

function formatCatalogEstimate(amount: string | null, currency: string): string {
  if (amount == null || amount.trim() === '') {
    return 'Price not set';
  }
  const trimmed = amount.replace(/\.00$/, '');
  const suffix = currency === 'GEL' ? 'GEL' : currency;
  return `${trimmed} ${suffix}`;
}

function fuelLabel(fuel: string): string {
  if (!fuel) return '';
  return fuel.charAt(0).toUpperCase() + fuel.slice(1);
}

/**
 * Maps a backend offer onto the existing MockJob UI shape.
 */
export function mapOfferToJob(
  offer: ApiMechanicOffer,
  status: JobStatus,
): MockJob {
  const request = offer.request;
  const vehicle = request.vehicle;
  const finalAmount = request.final_price_amount;
  const displayAmount = request.final_price_amount ?? request.estimated_price_amount;
  const customerPoint = parseGeoPoint(
    request.customer_latitude,
    request.customer_longitude,
  );
  return {
    id: offer.id,
    requestId: request.id,
    serviceId: asServiceId(request.service_code),
    status,
    customerLabel: request.customer_display_name,
    customerPhone: request.customer_phone ?? null,
    vehicleTitle: `${vehicle.make} ${vehicle.model}`.trim(),
    vehicleYear: vehicle.year,
    fuel: fuelLabel(vehicle.fuel),
    problem: request.problem_label,
    locationLabel: request.customer_address || 'Customer location',
    customerLatitude: customerPoint?.latitude ?? null,
    customerLongitude: customerPoint?.longitude ?? null,
    estimatedPayoutGel: displayAmount ? Number.parseFloat(displayAmount) : 0,
    estimatedPayoutDisplay: formatCatalogEstimate(
      displayAmount,
      request.estimated_price_currency,
    ),
    finalPriceAmount: finalAmount ?? null,
    quoteStatus: request.quote_status ?? 'NONE',
    priceConfirmedByCustomer: Boolean(request.price_confirmed_by_customer),
    priceProposedAt: request.price_proposed_at ?? null,
    earning: offer.earning
      ? {
          grossAmount: offer.earning.gross_amount,
          commissionAmount: offer.earning.commission_amount,
          netAmount: offer.earning.net_amount,
          currency: offer.earning.currency,
        }
      : null,
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
