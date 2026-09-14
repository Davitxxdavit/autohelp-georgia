import type { KeysProblem } from './types';

export const KEYS_PROBLEMS: KeysProblem[] = [
  { id: 'locked_out', title: 'Locked out of my car', emoji: '🚪' },
  { id: 'lost', title: 'Lost my key', emoji: '🔑' },
  { id: 'not_working', title: 'Key is not working', emoji: '🪫' },
  { id: 'other', title: 'Other', emoji: '❓' },
];

export const PRICE_CONFIRM_LATER = 'Price will be confirmed by the specialist';

export function getKeysProblem(id: string): KeysProblem | undefined {
  return KEYS_PROBLEMS.find((item) => item.id === id);
}
