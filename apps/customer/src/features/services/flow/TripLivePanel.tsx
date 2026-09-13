import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { TRACKING, type GeoPoint } from '@/features/maps/constants';
import { ETA_UNAVAILABLE, formatDistanceMeters, formatDurationSeconds } from '@/features/maps/format';
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
  const { route } = useTripRoute({
    requestId: request?.id,
    enabled: onTheWay && Boolean(mechanicPoint),
    origin: mechanicPoint,
  });
  const stale =
    onTheWay &&
    !isLocationFresh(
      request?.assigned_mechanic?.location_updated_at,
      TRACKING.LOCATION_STALE_MS,
    );
  const copy = trackingStatusCopy(status, kind);
  const distance = route?.available
    ? formatDistanceMeters(route.distance_meters)
    : null;
  const eta =
    route?.available && !stale
      ? formatDurationSeconds(route.duration_seconds)
      : null;

  let title = arrived ? 'Mechanic has arrived' : copy.title;
  let caption = copy.caption;
  if (onTheWay && stale) {
    caption = 'Updating mechanic location…';
  } else if (onTheWay && eta) {
    caption = [distance, eta].filter(Boolean).join(' · ');
  } else if (onTheWay && route && !route.available) {
    caption = ETA_UNAVAILABLE;
  } else if (onTheWay && mechanicPoint && !route) {
    caption = 'Updating route…';
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <AppText variant="caption" color="textMuted" style={styles.center}>
          {caption}
        </AppText>
        <AppText variant="h2" style={styles.center}>
          {title}
        </AppText>
      </View>
      <LiveJobMap
        customerPoint={customerPoint}
        mechanicPoint={mechanicPoint}
        routeCoordinates={onTheWay ? routePoints(route) : []}
        waitingForMechanic={!mechanicPoint && (onTheWay || status === 'ACCEPTED')}
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
