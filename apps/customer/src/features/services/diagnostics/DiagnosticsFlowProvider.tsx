import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { MOCK_BATUMI_LOCATION } from '@/features/services/flow/location';
import type { MockLocation } from '@/features/services/flow/types';

import type {
  DiagnosticsDraft,
  DiagnosticsOptionId,
  DiagnosticsProblemId,
  DiagnosticsRating,
} from './types';

export type DiagnosticsRequestCreated = {
  id: string;
  estimatedPriceAmount: string | null;
  estimatedPriceCurrency: string | null;
};

function createEmptyDraft(): DiagnosticsDraft {
  return {
    optionId: null,
    vehicleId: null,
    problemId: null,
    details: '',
    location: MOCK_BATUMI_LOCATION,
    requestedAt: null,
    completedAt: null,
    rating: null,
    serviceRequestId: null,
    backendEstimatedPriceAmount: null,
    backendEstimatedPriceCurrency: null,
  };
}

/** Survives navigating to /vehicle/add (parent stack unmounts this provider). */
let persistedDraft: DiagnosticsDraft = createEmptyDraft();

function persistDraft(next: DiagnosticsDraft): DiagnosticsDraft {
  persistedDraft = next;
  return next;
}

type DiagnosticsFlowContextValue = {
  draft: DiagnosticsDraft;
  setOption: (id: DiagnosticsOptionId) => void;
  setVehicle: (id: string) => void;
  setProblem: (id: DiagnosticsProblemId) => void;
  setDetails: (value: string) => void;
  setLocation: (location: MockLocation) => void;
  markRequested: (created?: DiagnosticsRequestCreated) => void;
  markCompleted: () => void;
  setRating: (rating: DiagnosticsRating) => void;
  reset: () => void;
};

const DiagnosticsFlowContext = createContext<DiagnosticsFlowContextValue | null>(
  null,
);

export function DiagnosticsFlowProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<DiagnosticsDraft>(persistedDraft);

  const setOption = useCallback((id: DiagnosticsOptionId) => {
    setDraft((prev) => persistDraft({ ...prev, optionId: id }));
  }, []);

  const setVehicle = useCallback((id: string) => {
    setDraft((prev) => persistDraft({ ...prev, vehicleId: id }));
  }, []);

  const setProblem = useCallback((id: DiagnosticsProblemId) => {
    setDraft((prev) => persistDraft({ ...prev, problemId: id }));
  }, []);

  const setDetails = useCallback((value: string) => {
    setDraft((prev) => persistDraft({ ...prev, details: value }));
  }, []);

  const setLocation = useCallback((location: MockLocation) => {
    setDraft((prev) => persistDraft({ ...prev, location }));
  }, []);

  const markRequested = useCallback((created?: DiagnosticsRequestCreated) => {
    setDraft((prev) =>
      persistDraft({
        ...prev,
        requestedAt: prev.requestedAt ?? new Date().toISOString(),
        serviceRequestId: created?.id ?? prev.serviceRequestId,
        backendEstimatedPriceAmount:
          created?.estimatedPriceAmount ?? prev.backendEstimatedPriceAmount,
        backendEstimatedPriceCurrency:
          created?.estimatedPriceCurrency ?? prev.backendEstimatedPriceCurrency,
      }),
    );
  }, []);

  const markCompleted = useCallback(() => {
    setDraft((prev) =>
      persistDraft({
        ...prev,
        completedAt: prev.completedAt ?? new Date().toISOString(),
      }),
    );
  }, []);

  const setRating = useCallback((rating: DiagnosticsRating) => {
    setDraft((prev) => persistDraft({ ...prev, rating }));
  }, []);

  const reset = useCallback(() => {
    setDraft(persistDraft(createEmptyDraft()));
  }, []);

  const value = useMemo<DiagnosticsFlowContextValue>(
    () => ({
      draft,
      setOption,
      setVehicle,
      setProblem,
      setDetails,
      setLocation,
      markRequested,
      markCompleted,
      setRating,
      reset,
    }),
    [
      draft,
      setOption,
      setVehicle,
      setProblem,
      setDetails,
      setLocation,
      markRequested,
      markCompleted,
      setRating,
      reset,
    ],
  );

  return (
    <DiagnosticsFlowContext.Provider value={value}>
      {children}
    </DiagnosticsFlowContext.Provider>
  );
}

export function useDiagnosticsFlow(): DiagnosticsFlowContextValue {
  const ctx = useContext(DiagnosticsFlowContext);
  if (!ctx) {
    throw new Error(
      'useDiagnosticsFlow must be used within DiagnosticsFlowProvider',
    );
  }
  return ctx;
}
