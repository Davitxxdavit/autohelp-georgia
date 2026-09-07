export { obtainTokenPair, refreshTokenPair, registerCustomer, getCurrentUser } from './auth';
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
  resolveDiagnosticsProblemCode,
  resolveKeysProblemCode,
} from './mapping';
export {
  createRoadsideRequest,
  createServiceRequest,
  cancelServiceRequest,
  getServiceRequest,
  listServiceRequests,
  listServiceRequestsFirstPage,
} from './requests';
export { createRating } from './ratings';
export { getServiceCatalog, listServices, useServices } from './services';
export {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasAccessToken,
  setTokenPair,
} from './tokens';
export type {
  ApiAssignedMechanic,
  ApiRequestStatus,
  ApiService,
  ApiServiceProblem,
  ApiServiceRequest,
  ApiVehicle,
  CreateServiceRequestBody,
  CurrentUser,
  TokenPair,
} from './types';
export {
  ACTIVE_REQUEST_STATUSES,
  HISTORY_REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  SERVICE_CODE_LABELS,
  formatRequestEstimate,
  formatRequestTime,
  isActiveRequestStatus,
  isApiRequestStatus,
  isHistoryRequestStatus,
  isTerminalRequestStatus,
  requestStatusLabel,
  requestStatusTone,
  serviceCodeLabel,
} from './status';
export {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
} from './vehicles';
