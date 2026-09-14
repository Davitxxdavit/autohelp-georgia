import type { Href } from 'expo-router';

import type { ApiServiceRequest, FrontendServiceId } from '@/lib/api/types';
import { formatRequestPrice, requestStatusLabel } from '@/lib/api/status';

import type { MechanicIdentity } from './types';

/** Development poll interval. Not a realtime channel. */
export const REQUEST_POLL_INTERVAL_MS = 2500;

export type CustomerRequestPhase =
  | 'searching'
  | 'found'
  | 'tracking'
  | 'completed'
  | 'cancelled'
  | 'stay';

export type RequestFlowRoutes = {
  searching: Href;
  found: Href;
  tracking: Href;
  completed: Href;
  home: Href;
};

export const BATTERY_FLOW_ROUTES: RequestFlowRoutes = {
  searching: '/battery/searching' as Href,
  found: '/battery/found' as Href,
  tracking: '/battery/tracking' as Href,
  completed: '/battery/completed' as Href,
  home: '/(app)/(tabs)' as Href,
};

export const DIAGNOSTICS_FLOW_ROUTES: RequestFlowRoutes = {
  searching: '/diagnostics/searching' as Href,
  found: '/diagnostics/found' as Href,
  tracking: '/diagnostics/tracking' as Href,
  completed: '/diagnostics/completed' as Href,
  home: '/(app)/(tabs)' as Href,
};

export const KEYS_FLOW_ROUTES: RequestFlowRoutes = {
  searching: '/keys/searching' as Href,
  found: '/keys/found' as Href,
  tracking: '/keys/tracking' as Href,
  completed: '/keys/completed' as Href,
  home: '/(app)/(tabs)' as Href,
};

export function customerPhaseForStatus(status: string): CustomerRequestPhase {
  if (status === 'REQUESTED' || status === 'SEARCHING') return 'searching';
  if (status === 'ASSIGNED' || status === 'ACCEPTED') return 'found';
  if (
    status === 'ON_THE_WAY' ||
    status === 'ARRIVED' ||
    status === 'IN_PROGRESS'
  ) {
    return 'tracking';
  }
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED' || status === 'DECLINED') return 'cancelled';
  return 'stay';
}

export function shouldNavigatePhase(
  current: CustomerRequestPhase,
  target: CustomerRequestPhase,
): boolean {
  if (target === 'stay') return false;
  if (current === target) return false;
  if (current === 'tracking' && target === 'found') return false;
  if (current === 'completed' || current === 'cancelled') return false;
  return true;
}

export function assignedMechanicIdentity(
  request: ApiServiceRequest | null | undefined,
): MechanicIdentity | null {
  const mechanic = request?.assigned_mechanic;
  if (!mechanic) return null;
  const rating = Number.parseFloat(String(mechanic.rating_average));
  return {
    id: mechanic.id,
    name: mechanic.first_name.trim() || 'Assigned mechanic',
    rating: Number.isFinite(rating) ? rating : Number.NaN,
    verified: mechanic.verified,
    phone: mechanic.phone ?? null,
  };
}

export function trackingStatusCopy(
  status: string,
  kind: 'battery' | 'diagnostics' | 'keys',
): { caption: string; title: string } {
  if (status === 'ARRIVED') {
    return { caption: 'Status', title: 'Arrived' };
  }
  if (status === 'IN_PROGRESS') {
    return { caption: 'Status', title: 'Service in progress' };
  }
  if (status === 'ON_THE_WAY') {
    if (kind === 'keys') {
      return { caption: 'Status', title: 'Locksmith on the way' };
    }
    if (kind === 'diagnostics') {
      return { caption: 'Status', title: 'Specialist on the way' };
    }
    return { caption: 'Status', title: 'On the way' };
  }
  if (status === 'ACCEPTED' || status === 'ASSIGNED') {
    return { caption: 'Status', title: 'Mechanic assigned' };
  }
  return { caption: 'Status', title: requestStatusLabel(status) };
}

export function requestVehicleLine(
  request: ApiServiceRequest | null | undefined,
): string | null {
  const vehicle = request?.vehicle;
  if (!vehicle) return null;
  return `${vehicle.make} ${vehicle.model} · ${vehicle.year}`;
}

export function requestEstimateLabel(
  request: ApiServiceRequest | null | undefined,
): string | null {
  if (!request) return null;
  return formatRequestPrice(request);
}

export function flowKindFromServiceCode(
  code: string,
): FrontendServiceId | null {
  if (code === 'BATTERY') return 'battery';
  if (code === 'DIAGNOSTICS') return 'diagnostics';
  if (code === 'AUTO_KEY') return 'keys';
  return null;
}

export function routesForServiceCode(code: string): RequestFlowRoutes | null {
  const kind = flowKindFromServiceCode(code);
  if (kind === 'battery') return BATTERY_FLOW_ROUTES;
  if (kind === 'diagnostics') return DIAGNOSTICS_FLOW_ROUTES;
  if (kind === 'keys') return KEYS_FLOW_ROUTES;
  return null;
}

export function hrefForRecoveredRequest(
  request: ApiServiceRequest,
): Href | null {
  const routes = routesForServiceCode(request.service_code);
  if (!routes) return null;
  const phase = customerPhaseForStatus(request.status);
  if (phase === 'searching') return routes.searching;
  if (phase === 'found') return routes.found;
  if (phase === 'tracking') return routes.tracking;
  if (phase === 'completed') return routes.completed;
  return routes.home;
}

export function locationSnapshotFromRequest(request: ApiServiceRequest) {
  return {
    id: `req_${request.id}`,
    label: request.customer_address?.trim() || 'Saved request location',
    city: '',
    country: '',
    point: {
      latitude: Number(request.customer_latitude),
      longitude: Number(request.customer_longitude),
    },
    source: 'request' as const,
  };
}
export function customerPointFromLiveOrDraft(
  live: Pick<ApiServiceRequest, 'customer_latitude' | 'customer_longitude'> | null | undefined,
  location: { source?: string; point: { latitude: number; longitude: number } } | null | undefined,
): { latitude: number; longitude: number } | undefined {
  const latitude = Number(live?.customer_latitude);
  const longitude = Number(live?.customer_longitude);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude };
  }
  if (location?.source === 'device' || location?.source === 'request') {
    return location.point;
  }
  return undefined;
}
