import type { ServiceOption } from './types';

export function formatEstimatedPrice(option: ServiceOption): string {
  if (!option.estimatedFrom) return '';
  if (option.estimatedNote) {
    return `From ${option.estimatedFrom.display} ${option.estimatedNote}`;
  }
  return `From ${option.estimatedFrom.display}`;
}
