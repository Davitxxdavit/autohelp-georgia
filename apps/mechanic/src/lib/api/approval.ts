import type { ApiMechanicMe } from '@/lib/api/types';

export function isMechanicApproved(
  me: Pick<ApiMechanicMe, 'approval_status' | 'verified'>,
): boolean {
  return me.approval_status === 'APPROVED' && me.verified;
}
