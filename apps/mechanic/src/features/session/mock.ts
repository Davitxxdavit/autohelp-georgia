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

export const MOCK_MECHANIC: MockMechanicProfile = {
  id: 'mech_giorgi',
  name: 'გიორგი',
  firstName: 'გიორგი',
  phone: '',
  rating: 4.9,
  verified: true,
  online: true,
  approvalStatus: 'APPROVED',
  supportedServices: ['BATTERY', 'DIAGNOSTICS', 'AUTO_KEY'],
  services: [],
};
