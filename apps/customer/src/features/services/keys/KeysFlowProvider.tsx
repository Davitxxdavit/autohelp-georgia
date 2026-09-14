import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { ApiServiceRequest } from '@/lib/api/types';
import { locationSnapshotFromRequest } from '@/features/services/flow/requestFlow';
import type { MockLocation } from '@/features/services/flow/types';

import type { KeysDraft, KeysProblemId, KeysRating } from './types';

export type KeysRequestCreated = {
  id: string;
  estimatedPriceAmount: string | null;
  estimatedPriceCurrency: string | null;
};

function createEmptyDraft(): KeysDraft {
  return {
    vehicleId: null,
    problemId: null,
    details: '',
    location: null,
    requestedAt: null,
    completedAt: null,
    rating: null,
    serviceRequestId: null,
    backendEstimatedPriceAmount: null,
    backendEstimatedPriceCurrency: null,
    liveRequest: null,
  };
}

/** Survives navigating to /vehicle/add (parent stack unmounts this provider). */
let persistedDraft: KeysDraft = createEmptyDraft();

function persistDraft(next: KeysDraft): KeysDraft {
  persistedDraft = next;
  return next;
}

type KeysFlowContextValue = {
  draft: KeysDraft;
  setVehicle: (id: string) => void;
  setProblem: (id: KeysProblemId) => void;
  setDetails: (value: string) => void;
  setLocation: (location: MockLocation) => void;
  markRequested: (created?: KeysRequestCreated) => void;
  markCompleted: (completedAt?: string | null) => void;
  setLiveRequest: (request: ApiServiceRequest) => void;
  setRating: (rating: KeysRating) => void;
  reset: () => void;
};

const KeysFlowContext = createContext<KeysFlowContextValue | null>(null);

export function KeysFlowProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<KeysDraft>(persistedDraft);

  const setVehicle = useCallback((id: string) => {
    setDraft((prev) => persistDraft({ ...prev, vehicleId: id }));
  }, []);

  const setProblem = useCallback((id: KeysProblemId) => {
    setDraft((prev) => persistDraft({ ...prev, problemId: id }));
  }, []);

  const setDetails = useCallback((value: string) => {
    setDraft((prev) => persistDraft({ ...prev, details: value }));
  }, []);

  const setLocation = useCallback((location: MockLocation) => {
    setDraft((prev) => persistDraft({ ...prev, location }));
  }, []);

  const markRequested = useCallback((created?: KeysRequestCreated) => {
    const prev = persistedDraft;
    const next = persistDraft({
      ...prev,
      requestedAt: prev.requestedAt ?? new Date().toISOString(),
      serviceRequestId: created?.id ?? prev.serviceRequestId,
      backendEstimatedPriceAmount:
        created?.estimatedPriceAmount ?? prev.backendEstimatedPriceAmount,
      backendEstimatedPriceCurrency:
        created?.estimatedPriceCurrency ?? prev.backendEstimatedPriceCurrency,
    });
    setDraft(next);
  }, []);

  const markCompleted = useCallback((completedAt?: string | null) => {
    setDraft((prev) =>
      persistDraft({
        ...prev,
        completedAt:
          prev.completedAt ?? completedAt ?? new Date().toISOString(),
      }),
    );
  }, []);

  const setLiveRequest = useCallback((liveRequest: ApiServiceRequest) => {
    setDraft((prev) => persistDraft({ ...prev, liveRequest }));
  }, []);

  const setRating = useCallback((rating: KeysRating) => {
    setDraft((prev) => persistDraft({ ...prev, rating }));
  }, []);

  const reset = useCallback(() => {
    setDraft(persistDraft(createEmptyDraft()));
  }, []);

  const value = useMemo<KeysFlowContextValue>(
    () => ({
      draft,
      setVehicle,
      setProblem,
      setDetails,
      setLocation,
      markRequested,
      markCompleted,
      setLiveRequest,
      setRating,
      reset,
    }),
    [
      draft,
      setVehicle,
      setProblem,
      setDetails,
      setLocation,
      markRequested,
      markCompleted,
      setLiveRequest,
      setRating,
      reset,
    ],
  );

  return (
    <KeysFlowContext.Provider value={value}>{children}</KeysFlowContext.Provider>
  );
}

export function hydrateKeysDraftFromRequest(request: ApiServiceRequest): void {
  persistDraft({
    ...createEmptyDraft(),
    vehicleId: request.vehicle?.id ?? null,
    serviceRequestId: request.id,
    liveRequest: request,
    requestedAt: request.requested_at ?? request.created_at,
    completedAt: request.completed_at,
    backendEstimatedPriceAmount: request.estimated_price_amount,
    backendEstimatedPriceCurrency: request.estimated_price_currency,
    location: locationSnapshotFromRequest(request),
  });
}

export function useKeysFlow(): KeysFlowContextValue {
  const ctx = useContext(KeysFlowContext);
  if (!ctx) {
    throw new Error('useKeysFlow must be used within KeysFlowProvider');
  }
  return ctx;
}
