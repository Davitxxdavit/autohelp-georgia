import { Alert } from 'react-native';

import { isApiError } from '@/lib/api/errors';
import { cancelServiceRequest, getServiceRequest } from '@/lib/api/requests';
import type { ApiServiceRequest } from '@/lib/api/types';

export function promptCancelRoadsideRequest(args: {
  requestId: string | null | undefined;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  onCancelled: () => void;
  onStatusChanged: (request: ApiServiceRequest) => void;
}): void {
  if (!args.requestId || args.busy) return;
  Alert.alert(
    'Cancel request?',
    'Are you sure you want to cancel this assistance request?',
    [
      { text: 'Keep request', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: () => {
          void runCancel(args);
        },
      },
    ],
  );
}

async function runCancel(args: {
  requestId: string | null | undefined;
  setBusy: (busy: boolean) => void;
  onCancelled: () => void;
  onStatusChanged: (request: ApiServiceRequest) => void;
}): Promise<void> {
  const requestId = args.requestId;
  if (!requestId) return;
  args.setBusy(true);
  try {
    await cancelServiceRequest(requestId);
    args.onCancelled();
  } catch (error) {
    if (isApiError(error) && error.status === 409) {
      try {
        const latest = await getServiceRequest(requestId);
        args.onStatusChanged(latest);
        Alert.alert(
          'Could not cancel',
          error.message || 'The mechanic has already started this job.',
        );
      } catch {
        Alert.alert(
          'Could not cancel',
          error.message || 'The request could not be cancelled.',
        );
      }
      return;
    }
    Alert.alert(
      'Could not cancel',
      isApiError(error) ? error.message : 'Check your connection and try again.',
    );
  } finally {
    args.setBusy(false);
  }
}
