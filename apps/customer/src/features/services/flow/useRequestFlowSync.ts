import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';

import { isApiError } from '@/lib/api/errors';
import { getServiceRequest } from '@/lib/api/requests';
import { isTerminalRequestStatus } from '@/lib/api/status';
import type { ApiServiceRequest } from '@/lib/api/types';

import {
  REQUEST_POLL_INTERVAL_MS,
  customerPhaseForStatus,
  shouldNavigatePhase,
  type CustomerRequestPhase,
  type RequestFlowRoutes,
} from './requestFlow';

/**
 * Polls one ServiceRequest while the screen is focused.
 * Backend status is authoritative. Overlapping fetches are skipped.
 */
export function useRequestFlowSync(args: {
  requestId: string | null;
  currentPhase: CustomerRequestPhase;
  routes: RequestFlowRoutes;
  onRequest?: (request: ApiServiceRequest) => void;
}): {
  request: ApiServiceRequest | null;
  notFound: boolean;
  pollError: boolean;
} {
  const router = useRouter();
  const { requestId, currentPhase, routes } = args;
  const [request, setRequest] = useState<ApiServiceRequest | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pollError, setPollError] = useState(false);
  const inFlightRef = useRef(false);
  const onRequestRef = useRef(args.onRequest);
  onRequestRef.current = args.onRequest;

  useFocusEffect(
    useCallback(() => {
      if (!requestId) {
        setNotFound(true);
        return;
      }

      setNotFound(false);
      let cancelled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      let stopped = false;

      const schedule = () => {
        if (cancelled || stopped) return;
        timer = setTimeout(() => {
          void tick();
        }, REQUEST_POLL_INTERVAL_MS);
      };

      const tick = async () => {
        if (cancelled || stopped) return;
        if (inFlightRef.current) {
          schedule();
          return;
        }
        inFlightRef.current = true;
        try {
          const data = await getServiceRequest(requestId);
          if (cancelled) return;
          setRequest(data);
          setPollError(false);
          onRequestRef.current?.(data);
          if (isTerminalRequestStatus(data.status)) {
            stopped = true;
            return;
          }
        } catch (error) {
          if (cancelled) return;
          if (isApiError(error) && error.status === 404) {
            setNotFound(true);
            stopped = true;
            return;
          }
          setPollError(true);
        } finally {
          inFlightRef.current = false;
          if (!cancelled && !stopped) schedule();
        }
      };

      void tick();

      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
      };
    }, [requestId]),
  );

  useEffect(() => {
    if (!request) return;
    const target = customerPhaseForStatus(request.status);
    if (!shouldNavigatePhase(currentPhase, target)) return;
    if (target === 'cancelled') {
      router.replace(routes.home);
      return;
    }
    if (target === 'stay') return;
    router.replace(routes[target]);
  }, [currentPhase, request, router, routes]);

  return { request, notFound, pollError };
}
