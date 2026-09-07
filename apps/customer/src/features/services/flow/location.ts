import * as Location from 'expo-location';

import type { CustomerLocation } from './types';

export type LocationFailureCode =
  | 'permission_denied'
  | 'services_disabled'
  | 'timeout'
  | 'unavailable';

export class LocationCaptureError extends Error {
  readonly code: LocationFailureCode;

  constructor(code: LocationFailureCode, message: string) {
    super(message);
    this.name = 'LocationCaptureError';
    this.code = code;
  }
}

export function isLocationCaptureError(
  value: unknown,
): value is LocationCaptureError {
  return value instanceof LocationCaptureError;
}

const CAPTURE_TIMEOUT_MS = 20_000;

/** Offset from the customer pin — visual specialist marker only, not GPS. */
export const MOCK_SPECIALIST_POINT = {
  latitude: 41.6284,
  longitude: 41.6452,
};

/** Historic mock delay. Request progression polls Django status. */
export const SEARCH_DELAY_MS = 2400;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new LocationCaptureError(
          'timeout',
          'Unable to get location. Try again in an open area.',
        ),
      );
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function formatCoordinateLabel(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

async function labelFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<Pick<CustomerLocation, 'label' | 'city' | 'country'>> {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0];
    if (!place) {
      return {
        label: formatCoordinateLabel(latitude, longitude),
        city: 'Current location',
        country: '',
      };
    }
    const street = [place.streetNumber, place.street].filter(Boolean).join(' ');
    const city = place.city || place.subregion || place.district || '';
    const country = place.country || '';
    const label =
      [street, city, country].filter(Boolean).join(', ') ||
      formatCoordinateLabel(latitude, longitude);
    return {
      label,
      city: city || 'Current location',
      country,
    };
  } catch {
    return {
      label: formatCoordinateLabel(latitude, longitude),
      city: 'Current location',
      country: '',
    };
  }
}

/**
 * One-shot foreground GPS for request create.
 * Does not watch position. Does not fall back to mock coordinates.
 */
export async function captureDeviceLocation(): Promise<CustomerLocation> {
  const servicesOn = await Location.hasServicesEnabledAsync();
  if (!servicesOn) {
    throw new LocationCaptureError(
      'services_disabled',
      'Turn on Location / GPS and try again.',
    );
  }

  const existing = await Location.getForegroundPermissionsAsync();
  let granted = existing.status === Location.PermissionStatus.GRANTED;
  if (!granted) {
    const asked = await Location.requestForegroundPermissionsAsync();
    granted = asked.status === Location.PermissionStatus.GRANTED;
  }
  if (!granted) {
    throw new LocationCaptureError(
      'permission_denied',
      'Location permission is required to send a specialist to you.',
    );
  }

  let position: Location.LocationObject;
  try {
    position = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }),
      CAPTURE_TIMEOUT_MS,
    );
  } catch (error) {
    if (isLocationCaptureError(error)) throw error;
    throw new LocationCaptureError(
      'unavailable',
      'Unable to get location. Try again.',
    );
  }

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new LocationCaptureError(
      'unavailable',
      'Unable to get location. Try again.',
    );
  }

  const named = await labelFromCoordinates(latitude, longitude);
  return {
    id: `loc_${latitude.toFixed(5)}_${longitude.toFixed(5)}`,
    point: { latitude, longitude },
    source: 'device',
    ...named,
  };
}

export function isUsableDeviceLocation(
  location: CustomerLocation | null | undefined,
): location is CustomerLocation {
  return location?.source === 'device';
}
