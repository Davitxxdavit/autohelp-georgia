import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';

import type { GeoPoint } from '@/features/maps/constants';
import { roundCoordinate } from '@/features/maps/geo';

export type LocationPrepResult =
  | { ok: true; point: GeoPoint }
  | { ok: false; code: 'permission_denied' | 'services_disabled' | 'unavailable' };

export async function prepareForegroundGps(): Promise<LocationPrepResult> {
  const servicesOn = await Location.hasServicesEnabledAsync();
  if (!servicesOn) {
    return { ok: false, code: 'services_disabled' };
  }
  const existing = await Location.getForegroundPermissionsAsync();
  let granted = existing.status === Location.PermissionStatus.GRANTED;
  if (!granted) {
    const asked = await Location.requestForegroundPermissionsAsync();
    granted = asked.status === Location.PermissionStatus.GRANTED;
  }
  if (!granted) {
    return { ok: false, code: 'permission_denied' };
  }
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const latitude = roundCoordinate(position.coords.latitude);
    const longitude = roundCoordinate(position.coords.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { ok: false, code: 'unavailable' };
    }
    return { ok: true, point: { latitude, longitude } };
  } catch {
    return { ok: false, code: 'unavailable' };
  }
}

export function alertLocationRequired(
  result: Extract<LocationPrepResult, { ok: false }>,
  onRetry?: () => void,
): void {
  const message =
    result.code === 'permission_denied'
      ? 'Location access is required to share your live position with the customer.'
      : result.code === 'services_disabled'
        ? 'Turn on location services to share your live position.'
        : 'Unable to get your location. Try again in an open area.';
  Alert.alert('Location required', message, [
    { text: 'Cancel', style: 'cancel' },
    ...(onRetry ? [{ text: 'Retry', onPress: onRetry }] : []),
    {
      text: 'Open Settings',
      onPress: () => {
        void Linking.openSettings();
      },
    },
  ]);
}
