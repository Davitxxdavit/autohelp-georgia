import { useEffect, useRef, useState } from 'react';

import { getRequestRoute } from '@/lib/api/mechanic';
import type { ApiTripRoute } from '@/lib/api/types';

import { TRACKING, type GeoPoint } from './constants';
import { haversineMeters } from './geo';

const UNAVAILABLE_ROUTE: ApiTripRoute = {
  available: false,
  origin: null,
  destination: null,
  distance_meters: null,
  duration_seconds: null,
  coordinates: [],
};

type UseTripRouteArgs = {
  requestId: string | null | undefined;
  enabled: boolean;
  origin: GeoPoint | null;
};

function logRoute(event: string, payload: Record<string, unknown>): void {
  if (!__DEV__) return;
  console.log('[AutoHelp] route', event, payload);
}

export function useTripRoute({
  requestId,
  enabled,
  origin,
}: UseTripRouteArgs): {
  route: ApiTripRoute | null;
  unavailable: boolean;
  loading: boolean;
} {
  const [route, setRoute] = useState<ApiTripRoute | null>(null);
  const [fetching, setFetching] = useState(false);
  const lastFetchAt = useRef(0);
  const lastOrigin = useRef<GeoPoint | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled || !requestId) {
      setRoute(null);
      setFetching(false);
      lastOrigin.current = null;
      lastFetchAt.current = 0;
      return;
    }
    if (!origin) {
      return;
    }

    const moved = lastOrigin.current
      ? haversineMeters(lastOrigin.current, origin)
      : Infinity;
    const elapsed = Date.now() - lastFetchAt.current;
    const shouldFetch =
      lastOrigin.current == null ||
      moved >= TRACKING.ROUTE_MIN_MOVE_METERS ||
      elapsed >= TRACKING.ROUTE_MIN_INTERVAL_MS;
    if (!shouldFetch || inFlight.current) return;

    inFlight.current = true;
    lastFetchAt.current = Date.now();
    lastOrigin.current = origin;
    setFetching(true);
    logRoute('request started', { requestId });
    void (async () => {
      try {
        const next = await getRequestRoute(requestId);
        logRoute('response', {
          available: next.available,
          distance_meters: next.distance_meters,
          duration_seconds: next.duration_seconds,
        });
        setRoute(next);
      } catch (error) {
        logRoute('error', {
          requestId,
          message: error instanceof Error ? error.message : 'unknown',
        });
        setRoute((current) => current ?? UNAVAILABLE_ROUTE);
      } finally {
        inFlight.current = false;
        setFetching(false);
      }
    })();
  }, [enabled, origin?.latitude, origin?.longitude, requestId]);

  return {
    route,
    unavailable: Boolean(enabled && route && !route.available),
    loading: Boolean(enabled && origin && fetching && !route?.available),
  };
}
