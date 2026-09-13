/** Display helpers for routing results. Never invent values. */

export function formatDistanceMeters(meters: number | null | undefined): string | null {
  if (meters == null || !Number.isFinite(meters) || meters < 0) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const rounded = km >= 10 ? km.toFixed(0) : km.toFixed(1);
  return `${rounded.replace(/\.0$/, '')} km`;
}

export function formatDurationSeconds(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export function formatArrivalIn(seconds: number | null | undefined): string | null {
  const duration = formatDurationSeconds(seconds);
  if (!duration) return null;
  return `Arrives in ~${duration}`;
}

export function formatDistanceAway(meters: number | null | undefined): string | null {
  const distance = formatDistanceMeters(meters);
  if (!distance) return null;
  return `${distance} away`;
}

export const ETA_UNAVAILABLE = 'ETA unavailable';
export const ETA_CALCULATING = 'Calculating arrival time…';
export const ETA_STALE = 'Updating mechanic location…';
export const ETA_PREPARING = 'Mechanic is preparing to leave';
export const ETA_ARRIVED = 'Mechanic has arrived';
