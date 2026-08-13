import type { ServiceId } from '@/constants/services';

export type RequestStatus = 'draft';

export type ServiceRequest = {
  id: string;
  vehicleId: string;
  serviceId: ServiceId;
  details: string;
  /** Human-readable mock location label — not real GPS */
  locationLabel: string;
  estimatedPriceLabel: string;
  status: RequestStatus;
  createdAt: string;
};

export type RequestDraftInput = {
  vehicleId: string;
  serviceId: ServiceId;
  details: string;
  locationLabel: string;
  estimatedPriceLabel: string;
};
