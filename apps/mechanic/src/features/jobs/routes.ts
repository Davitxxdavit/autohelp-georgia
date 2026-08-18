import type { Href } from 'expo-router';

import type { JobStatus } from './types';

/** Resume the correct operational screen for an accepted job. */
export function getActiveJobRoute(status: JobStatus): Href {
  if (status === 'IN_PROGRESS') {
    return '/job/service' as Href;
  }
  if (status === 'COMPLETED') {
    return '/job/completed' as Href;
  }
  return '/job/tracking' as Href;
}
