/** Throttling and freshness for live tracking. Not display estimates. */

export const TRACKING = {
  ROUTE_MIN_MOVE_METERS: 80,
  ROUTE_MIN_INTERVAL_MS: 20_000,
  LOCATION_STALE_MS: 45_000,
  GPS_UPLOAD_INTERVAL_MS: 5_000,
  GPS_UPLOAD_MIN_MOVE_METERS: 25,
} as const;

export type GeoPoint = {
  latitude: number;
  longitude: number;
};
