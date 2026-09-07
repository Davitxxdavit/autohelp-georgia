import { useCallback, useEffect, useRef, useState } from 'react';

import {
  captureDeviceLocation,
  isLocationCaptureError,
  isUsableDeviceLocation,
  type LocationFailureCode,
} from './location';
import type { CustomerLocation } from './types';

export type LocationCapturePhase =
  | 'loading'
  | 'ready'
  | 'permission_denied'
  | 'services_disabled'
  | 'failed';

export function useDeviceLocationCapture(
  saved: CustomerLocation | null,
  setLocation: (location: CustomerLocation) => void,
): {
  phase: LocationCapturePhase;
  message: string | null;
  retry: () => void;
} {
  const [phase, setPhase] = useState<LocationCapturePhase>(
    isUsableDeviceLocation(saved) ? 'ready' : 'loading',
  );
  const [message, setMessage] = useState<string | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(
    async (force: boolean) => {
      if (!force && isUsableDeviceLocation(saved)) {
        setPhase('ready');
        setMessage(null);
        return;
      }
      if (inFlight.current) return;
      inFlight.current = true;
      setPhase('loading');
      setMessage(null);
      try {
        const next = await captureDeviceLocation();
        setLocation(next);
        setPhase('ready');
      } catch (error) {
        const code: LocationFailureCode = isLocationCaptureError(error)
          ? error.code
          : 'unavailable';
        const text = isLocationCaptureError(error)
          ? error.message
          : 'Unable to get location. Try again.';
        if (code === 'permission_denied') setPhase('permission_denied');
        else if (code === 'services_disabled') setPhase('services_disabled');
        else setPhase('failed');
        setMessage(text);
      } finally {
        inFlight.current = false;
      }
    },
    [saved, setLocation],
  );

  useEffect(() => {
    void run(false);
    // Capture once when the location step opens. Retry / Change location forces a new snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  const retry = useCallback(() => {
    void run(true);
  }, [run]);

  return { phase, message, retry };
}
