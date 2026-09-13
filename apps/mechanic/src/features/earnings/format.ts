export function formatMoneyAmount(
  amount: string,
  currency = 'GEL',
): string {
  const trimmed = amount.replace(/\.00$/, '');
  return `${trimmed} ${currency}`;
}

export function formatEarningWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${months[date.getMonth()]}, ${hours}:${minutes}`;
}
