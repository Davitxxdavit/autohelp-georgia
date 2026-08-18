export type MockMoney = {
  amountGel: number;
  display: string;
  source: 'mock';
};

export type MockGeoPoint = {
  latitude: number;
  longitude: number;
};

/** Replace with expo-location / reverse geocode later */
export type MockLocation = {
  id: string;
  label: string;
  city: string;
  country: string;
  point: MockGeoPoint;
  source: 'mock';
};

export type MockMechanic = {
  id: string;
  name: string;
  rating: number;
  verified: boolean;
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
