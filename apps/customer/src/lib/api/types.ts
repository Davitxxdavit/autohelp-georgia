export type TokenPair = {
  access: string;
  refresh: string;
};

export type RegisterCustomerResponse = TokenPair & {
  user: {
    id: string;
    phone: string;
    role: string;
    first_name: string;
  };
};

export type TokenRefreshResponse = {
  access: string;
  refresh?: string;
};

export type BackendServiceCode = 'BATTERY' | 'DIAGNOSTICS' | 'AUTO_KEY';

export type FrontendServiceId = 'battery' | 'diagnostics' | 'keys';

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ApiServiceProblem = {
  id: string;
  code: string;
  label: string;
  active: boolean;
  sort_order: number;
};

export type ApiService = {
  id: string;
  code: BackendServiceCode | string;
  name: string;
  description: string;
  active: boolean;
  problems: ApiServiceProblem[];
  created_at: string;
  updated_at: string;
};

export type ApiVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  engine: string;
  fuel: string;
  license_plate: string;
  vin: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiVehicleWrite = {
  make: string;
  model: string;
  year: number;
  engine?: string;
  fuel: string;
  license_plate?: string;
  vin?: string | null;
};

export type ApiRequestStatus =
  | 'REQUESTED'
  | 'SEARCHING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED';

export type ApiAssignedMechanic = {
  id: string;
  first_name: string;
  verified: boolean;
  rating_average: string | number;
  phone?: string | null;
};

export type CurrentUser = {
  id: string;
  phone: string;
  role: string;
  first_name: string;
};

export type ApiServiceRequest = {
  id: string;
  status: ApiRequestStatus | string;
  vehicle: ApiVehicle;
  service: string;
  service_code: string;
  problem: string;
  problem_code: string;
  assigned_mechanic: ApiAssignedMechanic | null;
  customer_phone?: string | null;
  customer_latitude: string;
  customer_longitude: string;
  customer_address: string;
  estimated_price_amount: string | null;
  estimated_price_currency: string;
  price_is_estimate: boolean;
  requested_at: string | null;
  accepted_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string;
  created_at: string;
  updated_at: string;
};

/** Client-writable fields only. Backend owns status, mechanic, price, timestamps. */
export type CreateServiceRequestBody = {
  vehicle: string;
  service: string;
  problem: string;
  customer_latitude: number | string;
  customer_longitude: number | string;
  customer_address?: string;
};
