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
  customer_phone?: string | null;
  customer_address: string;
  customer_latitude: string;
  customer_longitude: string;
  estimated_price_amount: string | null;
  estimated_price_currency: string;
  price_is_estimate: boolean;
  final_price_amount?: string | null;
  quote_status?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  price_confirmed_by_customer?: boolean;
  price_confirmed_at?: string | null;
  price_proposed_at?: string | null;
  created_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  vehicle: ApiOfferVehicle;
};

export type ApiEarningSnapshot = {
  gross_amount: string;
  commission_amount: string;
  net_amount: string;
  currency: string;
};

export type ApiMechanicOffer = {
  id: string;
  status: string;
  created_at: string;
  responded_at: string | null;
  request: ApiOfferRequest;
  earning?: ApiEarningSnapshot | null;
};

export type ApiMechanicEarning = {
  id: string;
  request_id: string;
  service_name: string;
  gross_amount: string;
  commission_amount: string;
  net_amount: string;
  currency: string;
  created_at: string;
};

export type ApiMechanicEarningsSummary = {
  today: string;
  total: string;
  completed_jobs: number;
  currency: string;
};

export type ApiMechanicEarningsResponse = Paginated<ApiMechanicEarning> & {
  summary: ApiMechanicEarningsSummary;
};

export type ApiMechanicJobHistoryItem = {
  id: string;
  request_id: string;
  service_code: string;
  service_name: string;
  customer_display_name: string;
  status: string;
  completed_at: string | null;
  customer_address: string;
  final_price_amount: string | null;
  estimated_price_currency: string;
  gross_amount: string | null;
  commission_amount: string | null;
  net_amount: string | null;
  currency: string | null;
  created_at: string;
};

export type ApiMechanicMeService = {
  id: string;
  code: string;
  name: string;
};

export type ApiMechanicMe = {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  online: boolean;
  verified: boolean;
  approval_status: string;
  rating_average: string | number;
  services?: ApiMechanicMeService[];
};

export type RegisterMechanicResponse = TokenPair & {
  user: {
    id: string;
    phone: string;
    role: string;
    first_name: string;
    approval_status: string;
    verified: boolean;
  };
};

export type ApiService = {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
};

export type ApiRouteCoordinate = {
  latitude: string;
  longitude: string;
};

export type ApiTripRoute = {
  available: boolean;
  origin: { latitude: string; longitude: string } | null;
  destination: { latitude: string; longitude: string } | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  coordinates: ApiRouteCoordinate[];
};
