import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

import type { GeoPoint } from '@/features/maps/constants';
import { roundCoordinate } from '@/features/maps/geo';

export type LocationPrepCode =
  | 'permission_denied'
  | 'services_disabled'
  | 'unavailable';

export type LocationPrepResult =
  | { ok: true; point: GeoPoint }
  | { ok: false; code: LocationPrepCode };

async function requestForegroundPermission(): Promise<boolean> {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.status === Location.PermissionStatus.GRANTED) return true;
  const asked = await Location.requestForegroundPermissionsAsync();
  return asked.status === Location.PermissionStatus.GRANTED;
}

async function ensureLocationServices(): Promise<boolean> {
  if (await Location.hasServicesEnabledAsync()) return true;
  if (Platform.OS !== 'android') return false;
  try {
    await Location.enableNetworkProviderAsync();
  } catch {
    return false;
  }
  return Location.hasServicesEnabledAsync();
}

async function readCurrentPoint(): Promise<GeoPoint | null> {
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const latitude = roundCoordinate(position.coords.latitude);
    const longitude = roundCoordinate(position.coords.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

export async function prepareForegroundGps(): Promise<LocationPrepResult> {
  const granted = await requestForegroundPermission();
  if (!granted) {
    return { ok: false, code: 'permission_denied' };
  }

  const servicesOn = await ensureLocationServices();
  if (!servicesOn) {
    return { ok: false, code: 'services_disabled' };
  }

  const point = await readCurrentPoint();
  if (!point) {
    return { ok: false, code: 'unavailable' };
  }
  return { ok: true, point };
}

function issueMessage(code: LocationPrepCode): string {
  if (code === 'permission_denied') {
    return 'Location access is required to share your live position with the customer.';
  }
  if (code === 'services_disabled') {
    return 'Location services are required to start driving and share your position with the customer.';
  }
  return 'Unable to get your location. Try again in an open area.';
}

export function alertLocationRequired(
  result: Extract<LocationPrepResult, { ok: false }>,
  onRetry?: () => void,
): void {
  Alert.alert('Location required', issueMessage(result.code), [
    { text: 'Cancel', style: 'cancel' },
    ...(onRetry ? [{ text: 'Try again', onPress: onRetry }] : []),
    {
      text: 'Open Settings',
      onPress: () => {
        void Linking.openSettings();
      },
    },
  ]);
}

export function trackingIssueMessage(code: LocationPrepCode): string {
  return issueMessage(code);
}
