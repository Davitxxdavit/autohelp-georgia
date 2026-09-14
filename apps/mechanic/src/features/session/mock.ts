import type { ServiceId } from '@/constants/services';

export type MechanicServiceSummary = {
  id: string;
  code: string;
  name: string;
};

export type MockMechanicProfile = {
  id: string;
  name: string;
  firstName: string;
  phone: string;
  rating: number;
  verified: boolean;
  online: boolean;
  approvalStatus: string;
  supportedServices: ServiceId[];
  services: MechanicServiceSummary[];
};
