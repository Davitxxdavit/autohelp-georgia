export { obtainTokenPair, refreshTokenPair } from './auth';
export { apiGetList, apiRequest, unwrapList } from './client';
export { getApiBaseUrl, isApiConfigured, requireApiBaseUrl } from './config';
export { obtainDevelopmentJwt } from './devAuth';
export { ApiError, isApiError, type ApiErrorKind } from './errors';
export {
  BATTERY_PROBLEM_TO_BACKEND,
  DIAGNOSTICS_PROBLEM_TO_BACKEND,
  FRONTEND_SERVICE_TO_BACKEND,
  KEYS_PROBLEM_TO_BACKEND,
  resolveBatteryProblemCode,
  resolveCatalogIds,
} from './mapping';
export {
  createServiceRequest,
  getServiceRequest,
  listServiceRequests,
} from './requests';
export { getServiceCatalog, listServices, useServices } from './services';
export {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasAccessToken,
  setTokenPair,
} from './tokens';
export type {
  ApiService,
  ApiServiceProblem,
  ApiServiceRequest,
  ApiVehicle,
  CreateServiceRequestBody,
  TokenPair,
} from './types';
export {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
} from './vehicles';
