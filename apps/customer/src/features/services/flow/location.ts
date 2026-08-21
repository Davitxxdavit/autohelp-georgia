import type { MockGeoPoint, MockLocation } from './types';

export const MOCK_BATUMI_LOCATION: MockLocation = {
  id: 'loc_batumi_center',
  label: 'Batumi, Georgia',
  city: 'Batumi',
  country: 'Georgia',
  point: {
    latitude: 41.6168,
    longitude: 41.6367,
  },
  source: 'mock',
};

/** Offset from the customer pin — replace with live specialist coordinates. */
export const MOCK_SPECIALIST_POINT: MockGeoPoint = {
  latitude: 41.6284,
  longitude: 41.6452,
};

/** Historic mock delay. Request progression now polls Django status. */
export const SEARCH_DELAY_MS = 2400;

/**
 * Customer location for roadside flows.
 * Swap the body for expo-location + reverse geocode without changing callers.
 */
export async function resolveCustomerLocation(): Promise<MockLocation> {
  return MOCK_BATUMI_LOCATION;
}
