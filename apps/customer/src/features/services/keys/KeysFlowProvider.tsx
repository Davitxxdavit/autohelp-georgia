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

import type { KeysDraft, KeysProblemId, KeysRating } from './types';

function createEmptyDraft(): KeysDraft {
  return {
    vehicleId: null,
    problemId: null,
    details: '',
    location: MOCK_BATUMI_LOCATION,
    requestedAt: null,
    completedAt: null,
    rating: null,
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
  markRequested: () => void;
  markCompleted: () => void;
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

  const markRequested = useCallback(() => {
    setDraft((prev) =>
      persistDraft({
        ...prev,
        requestedAt: prev.requestedAt ?? new Date().toISOString(),
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
      setRating,
      reset,
    ],
  );

  return (
    <KeysFlowContext.Provider value={value}>{children}</KeysFlowContext.Provider>
  );
}

export function useKeysFlow(): KeysFlowContextValue {
  const ctx = useContext(KeysFlowContext);
  if (!ctx) {
    throw new Error('useKeysFlow must be used within KeysFlowProvider');
  }
  return ctx;
}
