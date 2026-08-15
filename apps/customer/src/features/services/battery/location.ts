import { MOCK_BATUMI_LOCATION } from './mock';
import type { MockLocation } from './types';

/**
 * Customer location for the battery flow.
 * Swap the body for expo-location + reverse geocode without changing callers.
 */
export async function resolveCustomerLocation(): Promise<MockLocation> {
  return MOCK_BATUMI_LOCATION;
}
