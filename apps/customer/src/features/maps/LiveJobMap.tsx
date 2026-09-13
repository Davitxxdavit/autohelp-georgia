import { Platform, StyleSheet, View } from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  type Region,
} from 'react-native-maps';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import type { GeoPoint } from './constants';

type LiveJobMapProps = {
  customerPoint?: GeoPoint | null;
  mechanicPoint?: GeoPoint | null;
  routeCoordinates?: GeoPoint[];
  customerLabel?: string;
  mechanicLabel?: string;
  waitingForMechanic?: boolean;
  bannerText?: string;
  height?: number;
};

function regionForPoints(points: GeoPoint[]): Region | undefined {
  if (points.length === 0) return undefined;
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latDelta = Math.max(0.008, (maxLat - minLat) * 1.8 || 0.012);
  const lngDelta = Math.max(0.008, (maxLng - minLng) * 1.8 || 0.012);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export function LiveJobMap({
  customerPoint,
  mechanicPoint,
  routeCoordinates = [],
  customerLabel = 'You',
  mechanicLabel = 'Mechanic',
  waitingForMechanic = false,
  bannerText = 'Waiting for mechanic location',
  height = 240,
}: LiveJobMapProps) {
  const points = [customerPoint, mechanicPoint].filter(Boolean) as GeoPoint[];
  const region = regionForPoints(points);
  const polyline =
    routeCoordinates.length >= 2 ? routeCoordinates : undefined;

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.wrap, { height }]}>
        <AppText variant="caption" color="textMuted">
          Map is available on iOS and Android.
        </AppText>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={[styles.wrap, styles.empty, { height }]}>
        <AppText variant="caption" color="textMuted">
          Location unavailable
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        region={region}
        toolbarEnabled={false}
        loadingEnabled
        accessibilityLabel="Job map"
      >
        {customerPoint ? (
          <Marker
            coordinate={customerPoint}
            title={customerLabel}
            pinColor={colors.textPrimary}
          />
        ) : null}
        {mechanicPoint ? (
          <Marker
            coordinate={mechanicPoint}
            title={mechanicLabel}
            pinColor={colors.primary}
          />
        ) : null}
        {polyline ? (
          <Polyline
            coordinates={polyline}
            strokeColor={colors.primary}
            strokeWidth={4}
          />
        ) : null}
      </MapView>
      {waitingForMechanic && !mechanicPoint ? (
        <View style={styles.banner} pointerEvents="none">
          <AppText variant="caption" color="textSecondary">
            {bannerText}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  banner: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.overlay,
    alignItems: 'center',
  },
});
