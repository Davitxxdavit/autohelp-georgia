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
  onCancelled?: () => void;
}): {
  request: ApiServiceRequest | null;
  notFound: boolean;
  pollError: boolean;
  retry: () => void;
  replaceRequest: (next: ApiServiceRequest) => void;
} {
  const router = useRouter();
  const { requestId, currentPhase, routes } = args;
  const [request, setRequest] = useState<ApiServiceRequest | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pollError, setPollError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const inFlightRef = useRef(false);
  const onRequestRef = useRef(args.onRequest);
  onRequestRef.current = args.onRequest;
  const onCancelledRef = useRef(args.onCancelled);
  onCancelledRef.current = args.onCancelled;

  const replaceRequest = useCallback((next: ApiServiceRequest) => {
    setRequest(next);
    setPollError(false);
    onRequestRef.current?.(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!requestId) {
        // Summary may still be committing the backend ID. Do not 404 instantly.
        const wait = setTimeout(() => {
          setNotFound(true);
        }, 800);
        return () => clearTimeout(wait);
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
    }, [requestId, retryNonce]),
  );

  const retry = useCallback(() => {
    setPollError(false);
    setRetryNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!request) return;
    const target = customerPhaseForStatus(request.status);
    if (!shouldNavigatePhase(currentPhase, target)) return;
    if (target === 'cancelled') {
      onCancelledRef.current?.();
      router.replace(routes.home);
      return;
    }
    if (target === 'stay') return;
    router.replace(routes[target]);
  }, [currentPhase, request, router, routes]);

  return { request, notFound, pollError, retry, replaceRequest };
}
