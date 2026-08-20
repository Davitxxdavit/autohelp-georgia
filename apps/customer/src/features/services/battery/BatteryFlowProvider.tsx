import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { MOCK_BATUMI_LOCATION } from './mock';
import type {
  BatteryDraft,
  BatteryOptionId,
  BatteryProblemId,
  BatteryRating,
  MockLocation,
} from './types';

export type BatteryRequestCreated = {
  id: string;
  estimatedPriceAmount: string | null;
  estimatedPriceCurrency: string | null;
};

function createEmptyDraft(): BatteryDraft {
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
let persistedDraft: BatteryDraft = createEmptyDraft();

function persistDraft(next: BatteryDraft): BatteryDraft {
  persistedDraft = next;
  return next;
}

type BatteryFlowContextValue = {
  draft: BatteryDraft;
  setOption: (id: BatteryOptionId) => void;
  setVehicle: (id: string) => void;
  setProblem: (id: BatteryProblemId) => void;
  setDetails: (value: string) => void;
  setLocation: (location: MockLocation) => void;
  markRequested: (created?: BatteryRequestCreated) => void;
  markCompleted: () => void;
  setRating: (rating: BatteryRating) => void;
  reset: () => void;
};

const BatteryFlowContext = createContext<BatteryFlowContextValue | null>(null);

export function BatteryFlowProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BatteryDraft>(persistedDraft);

  const setOption = useCallback((id: BatteryOptionId) => {
    setDraft((prev) => persistDraft({ ...prev, optionId: id }));
  }, []);

  const setVehicle = useCallback((id: string) => {
    setDraft((prev) => persistDraft({ ...prev, vehicleId: id }));
  }, []);

  const setProblem = useCallback((id: BatteryProblemId) => {
    setDraft((prev) => persistDraft({ ...prev, problemId: id }));
  }, []);

  const setDetails = useCallback((value: string) => {
    setDraft((prev) => persistDraft({ ...prev, details: value }));
  }, []);

  const setLocation = useCallback((location: MockLocation) => {
    setDraft((prev) => persistDraft({ ...prev, location }));
  }, []);

  const markRequested = useCallback((created?: BatteryRequestCreated) => {
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

  const setRating = useCallback((rating: BatteryRating) => {
    setDraft((prev) => persistDraft({ ...prev, rating }));
  }, []);

  const reset = useCallback(() => {
    setDraft(persistDraft(createEmptyDraft()));
  }, []);

  const value = useMemo<BatteryFlowContextValue>(
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
    <BatteryFlowContext.Provider value={value}>
      {children}
    </BatteryFlowContext.Provider>
  );
}

export function useBatteryFlow(): BatteryFlowContextValue {
  const ctx = useContext(BatteryFlowContext);
  if (!ctx) {
    throw new Error('useBatteryFlow must be used within BatteryFlowProvider');
  }
  return ctx;
}
