import { formatDateTime } from '@/lib/datetime';

export function formatMoneyAmount(
  amount: string,
  currency = 'GEL',
): string {
  const trimmed = amount.replace(/\.00$/, '');
  return `${trimmed} ${currency}`;
}

export function formatEarningWhen(iso: string): string {
  return formatDateTime(iso);
}
