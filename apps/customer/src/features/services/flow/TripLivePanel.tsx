import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { TRACKING, type GeoPoint } from '@/features/maps/constants';
import {
  ETA_ARRIVED,
  ETA_CALCULATING,
  ETA_PREPARING,
  ETA_STALE,
  ETA_UNAVAILABLE,
  formatArrivalIn,
  formatDistanceAway,
} from '@/features/maps/format';
import { isLocationFresh, parseGeoPoint } from '@/features/maps/geo';
import { LiveJobMap } from '@/features/maps/LiveJobMap';
import { useTripRoute } from '@/features/maps/useTripRoute';
import type { ApiServiceRequest } from '@/lib/api/types';
import { spacing } from '@/theme/spacing';

import { trackingStatusCopy } from './requestFlow';

export function mechanicPointFromRequest(
  request: ApiServiceRequest | null | undefined,
): GeoPoint | null {
  const mechanic = request?.assigned_mechanic;
  if (!mechanic) return null;
  return parseGeoPoint(mechanic.current_latitude, mechanic.current_longitude);
}

function routePoints(route: { coordinates?: { latitude: string; longitude: string }[] } | null): GeoPoint[] {
  if (!route?.coordinates) return [];
  return route.coordinates
    .map((point) => parseGeoPoint(point.latitude, point.longitude))
    .filter((point): point is GeoPoint => point != null);
}

function isMechanicFixStale(
  updatedAt: string | null | undefined,
  hasPoint: boolean,
): boolean {
  if (!hasPoint) return false;
  if (!updatedAt) return false;
  return !isLocationFresh(updatedAt, TRACKING.LOCATION_STALE_MS);
}

export function TripLivePanel({
  request,
  customerPoint,
  kind,
}: {
  request: ApiServiceRequest | null | undefined;
  customerPoint?: GeoPoint | null;
  kind: 'battery' | 'diagnostics' | 'keys';
}) {
  const status = request?.status ?? '';
  const mechanicPoint = mechanicPointFromRequest(request);
  const onTheWay = status === 'ON_THE_WAY';
  const arrived = status === 'ARRIVED';
  const accepted = status === 'ACCEPTED' || status === 'ASSIGNED';
  const { route, unavailable, loading } = useTripRoute({
    requestId: request?.id,
    enabled: onTheWay && Boolean(mechanicPoint),
    origin: mechanicPoint,
  });
  const stale = onTheWay && isMechanicFixStale(
    request?.assigned_mechanic?.location_updated_at,
    Boolean(mechanicPoint),
  );
  const copy = trackingStatusCopy(status, kind);
  const arrival = route?.available
    ? formatArrivalIn(route.duration_seconds)
    : null;
  const distanceAway = route?.available
    ? formatDistanceAway(route.distance_meters)
    : null;

  let title = copy.title;
  let subtitle: string | null = null;

  if (arrived) {
    title = ETA_ARRIVED;
  } else if (accepted) {
    title = ETA_PREPARING;
  } else if (onTheWay && stale) {
    title = ETA_STALE;
  } else if (onTheWay && arrival) {
    title = arrival;
    subtitle = distanceAway;
  } else if (onTheWay && unavailable) {
    title = ETA_UNAVAILABLE;
  } else if (onTheWay && (loading || (mechanicPoint && !route))) {
    title = ETA_CALCULATING;
  } else if (onTheWay && !mechanicPoint) {
    subtitle = 'Waiting for mechanic location';
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <AppText variant="h2" style={styles.center}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" color="textSecondary" style={styles.center}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <LiveJobMap
        customerPoint={customerPoint}
        mechanicPoint={mechanicPoint}
        routeCoordinates={onTheWay ? routePoints(route) : []}
        waitingForMechanic={!mechanicPoint && (onTheWay || accepted)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
});
