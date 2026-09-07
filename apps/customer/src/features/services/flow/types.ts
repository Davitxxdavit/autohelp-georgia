export type MockMoney = {
  amountGel: number;
  display: string;
  source: 'mock';
};

export type MockGeoPoint = {
  latitude: number;
  longitude: number;
};

export type MechanicIdentity = {
  id: string;
  name: string;
  rating: number;
  verified: boolean;
  phone?: string | null;
  distanceKm?: number;
  etaMinutes?: number;
};

/** Customer GPS snapshot used for request create. Never a silent mock. */
export type CustomerLocation = {
  id: string;
  label: string;
  city: string;
  country: string;
  point: MockGeoPoint;
  source: 'device';
};

/** @deprecated Use CustomerLocation. Kept so existing imports compile. */
export type MockLocation = CustomerLocation;

export type MockMechanic = MechanicIdentity & {
  distanceKm: number;
  etaMinutes: number;
  source: 'mock';
};

export type ServiceRating = {
  overall: number;
  speed: number;
  price: number;
  quality: number;
  comment: string;
};

export type ServiceOption = {
  id: string;
  title: string;
  subtitle: string;
  estimatedFrom?: MockMoney;
  estimatedNote?: string;
};

export type ServiceProblem = {
  id: string;
  title: string;
  emoji: string;
};
