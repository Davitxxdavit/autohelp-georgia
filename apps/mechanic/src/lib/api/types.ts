export type TokenPair = {
  access: string;
  refresh: string;
};

export type TokenRefreshResponse = {
  access: string;
  refresh?: string;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ApiOfferVehicle = {
  make: string;
  model: string;
  year: number;
  fuel: string;
};

export type ApiOfferRequest = {
  id: string;
  status: string;
  service_code: string;
  service_name: string;
  problem_code: string;
  problem_label: string;
  customer_display_name: string;
  customer_address: string;
  customer_latitude: string;
  customer_longitude: string;
  estimated_price_amount: string | null;
  estimated_price_currency: string;
  price_is_estimate: boolean;
  created_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  vehicle: ApiOfferVehicle;
};

export type ApiMechanicOffer = {
  id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  request: ApiOfferRequest;
};

export type ApiMechanicMe = {
  id: string;
  first_name: string;
  last_name: string;
  online: boolean;
  verified: boolean;
  approval_status: string;
  rating_average: string | number;
};
