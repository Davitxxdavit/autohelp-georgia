import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'expo-router';

import { hydrateBatteryDraftFromRequest } from '@/features/services/battery/BatteryFlowProvider';
import { hydrateDiagnosticsDraftFromRequest } from '@/features/services/diagnostics/DiagnosticsFlowProvider';
import { hydrateKeysDraftFromRequest } from '@/features/services/keys/KeysFlowProvider';
import {
  flowKindFromServiceCode,
  hrefForRecoveredRequest,
} from '@/features/services/flow/requestFlow';
import { getActiveServiceRequest } from '@/lib/api/requests';
import { isApiError } from '@/lib/api/errors';
import type { ApiServiceRequest } from '@/lib/api/types';
import { hasAccessToken } from '@/lib/api/tokens';

type ActiveRequestContextValue = {
  activeRequest: ApiServiceRequest | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<ApiServiceRequest | null>;
};

const ActiveRequestContext = createContext<ActiveRequestContextValue | null>(
  null,
);

function hydrateFlow(request: ApiServiceRequest): void {
  const kind = flowKindFromServiceCode(request.service_code);
  if (kind === 'battery') hydrateBatteryDraftFromRequest(request);
  if (kind === 'diagnostics') hydrateDiagnosticsDraftFromRequest(request);
  if (kind === 'keys') hydrateKeysDraftFromRequest(request);
}

export function resumeCustomerRequest(request: ApiServiceRequest): ReturnType<
  typeof hrefForRecoveredRequest
> {
  hydrateFlow(request);
  return hrefForRecoveredRequest(request);
}

export function ActiveRequestProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [activeRequest, setActiveRequest] = useState<ApiServiceRequest | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const routedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!(await hasAccessToken())) {
      setActiveRequest(null);
      setLoading(false);
      return null;
    }
    try {
      const next = await getActiveServiceRequest();
      setActiveRequest(next);
      setError(null);
      if (next) hydrateFlow(next);
      return next;
    } catch (caught) {
      setError(
        isApiError(caught) ? caught.message : 'Could not load active request.',
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading || routedRef.current || !activeRequest) return;
    const href = hrefForRecoveredRequest(activeRequest);
    if (!href) return;
    routedRef.current = true;
    router.replace(href);
  }, [activeRequest, loading, router]);

  const value = useMemo(
    () => ({ activeRequest, loading, error, refresh }),
    [activeRequest, loading, error, refresh],
  );

  return (
    <ActiveRequestContext.Provider value={value}>
      {children}
    </ActiveRequestContext.Provider>
  );
}

export function useActiveRequest(): ActiveRequestContextValue {
  const ctx = useContext(ActiveRequestContext);
  if (!ctx) {
    throw new Error('useActiveRequest must be used within ActiveRequestProvider');
  }
  return ctx;
}
