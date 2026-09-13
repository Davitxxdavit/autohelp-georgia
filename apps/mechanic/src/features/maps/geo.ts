import type { GeoPoint } from './constants';

export function parseCoordinate(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function parseGeoPoint(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
): GeoPoint | null {
  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  if (lat == null || lng == null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { latitude: lat, longitude: lng };
}

export function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earth = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isLocationFresh(
  updatedAt: string | null | undefined,
  staleMs: number,
  now = Date.now(),
): boolean {
  if (!updatedAt) return false;
  const then = new Date(updatedAt).getTime();
  if (!Number.isFinite(then)) return false;
  return now - then <= staleMs;
}
