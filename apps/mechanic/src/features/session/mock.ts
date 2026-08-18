import type { ServiceId } from '@/constants/services';

export type MockMechanicProfile = {
  id: string;
  name: string;
  rating: number;
  verified: boolean;
  online: boolean;
  supportedServices: ServiceId[];
};

export const MOCK_MECHANIC: MockMechanicProfile = {
  id: 'mech_giorgi',
  name: 'გიორგი',
  rating: 4.9,
  verified: true,
  online: true,
  supportedServices: ['BATTERY', 'DIAGNOSTICS', 'AUTO_KEY'],
};
