import { useEffect, useRef, useState } from 'react';

import { getRequestRoute } from '@/lib/api/mechanic';
import type { ApiTripRoute } from '@/lib/api/types';

import { TRACKING, type GeoPoint } from './constants';
import { haversineMeters } from './geo';

type UseTripRouteArgs = {
  requestId: string | null | undefined;
  enabled: boolean;
  origin: GeoPoint | null;
};

export function useTripRoute({
  requestId,
  enabled,
  origin,
}: UseTripRouteArgs): {
  route: ApiTripRoute | null;
  unavailable: boolean;
} {
  const [route, setRoute] = useState<ApiTripRoute | null>(null);
  const lastFetchAt = useRef(0);
  const lastOrigin = useRef<GeoPoint | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled || !requestId || !origin) {
      setRoute(null);
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
    void (async () => {
      try {
        const next = await getRequestRoute(requestId);
        setRoute(next);
      } catch {
        setRoute((current) => current);
      } finally {
        inFlight.current = false;
      }
    })();
  }, [enabled, origin?.latitude, origin?.longitude, requestId]);

  return {
    route,
    unavailable: Boolean(enabled && origin && route && !route.available),
  };
}
