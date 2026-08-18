import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { cloneJob, MOCK_BATTERY_JOB } from '@/features/jobs/mock';
import {
  JOB_STATUS_TRANSITIONS,
  type JobStatus,
  type MockJob,
} from '@/features/jobs/types';

import { MOCK_MECHANIC, type MockMechanicProfile } from './mock';

type MechanicSessionValue = {
  profile: MockMechanicProfile;
  incomingJob: MockJob | null;
  activeJob: MockJob | null;
  getJob: (id: string) => MockJob | undefined;
  setOnline: (online: boolean) => void;
  acceptJob: (id: string) => MockJob | null;
  declineJob: (id: string) => boolean;
  updateJobStatus: (jobId: string, status: JobStatus) => MockJob | null;
  finishJob: () => boolean;
};

const MechanicSessionContext = createContext<MechanicSessionValue | null>(null);

export function MechanicSessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MockMechanicProfile>(MOCK_MECHANIC);
  const [activeJob, setActiveJob] = useState<MockJob | null>(null);
  const [offerDismissed, setOfferDismissed] = useState(false);

  const incomingJob = useMemo(() => {
    if (!profile.online || activeJob || offerDismissed) return null;
    return cloneJob(MOCK_BATTERY_JOB, 'ASSIGNED');
  }, [activeJob, offerDismissed, profile.online]);

  const getJob = useCallback(
    (id: string): MockJob | undefined => {
      if (activeJob?.id === id) return activeJob;
      if (incomingJob?.id === id) return incomingJob;
      return undefined;
    },
    [activeJob, incomingJob],
  );

  const setOnline = useCallback((online: boolean) => {
    setProfile((prev) => ({ ...prev, online }));
    if (online) {
      setOfferDismissed(false);
    }
  }, []);

  const acceptJob = useCallback(
    (id: string): MockJob | null => {
      if (activeJob?.id === id) return activeJob;
      if (incomingJob?.id !== id) return null;
      const next = cloneJob(incomingJob, 'ACCEPTED');
      setActiveJob(next);
      setOfferDismissed(false);
      return next;
    },
    [activeJob, incomingJob],
  );

  const declineJob = useCallback(
    (id: string): boolean => {
      if (activeJob?.id === id) return false;
      if (incomingJob?.id !== id) return false;
      setOfferDismissed(true);
      return true;
    },
    [activeJob, incomingJob],
  );

  const updateJobStatus = useCallback(
    (jobId: string, status: JobStatus): MockJob | null => {
      if (!activeJob || activeJob.id !== jobId) return null;
      if (JOB_STATUS_TRANSITIONS[activeJob.status] !== status) return null;
      const next = cloneJob(activeJob, status);
      setActiveJob(next);
      return next;
    },
    [activeJob],
  );

  const finishJob = useCallback((): boolean => {
    if (!activeJob || activeJob.status !== 'COMPLETED') return false;
    setActiveJob(null);
    return true;
  }, [activeJob]);

  const value = useMemo<MechanicSessionValue>(
    () => ({
      profile,
      incomingJob,
      activeJob,
      getJob,
      setOnline,
      acceptJob,
      declineJob,
      updateJobStatus,
      finishJob,
    }),
    [
      acceptJob,
      activeJob,
      declineJob,
      finishJob,
      getJob,
      incomingJob,
      profile,
      setOnline,
      updateJobStatus,
    ],
  );

  return (
    <MechanicSessionContext.Provider value={value}>
      {children}
    </MechanicSessionContext.Provider>
  );
}

export function useMechanicSession(): MechanicSessionValue {
  const ctx = useContext(MechanicSessionContext);
  if (!ctx) {
    throw new Error('useMechanicSession must be used within MechanicSessionProvider');
  }
  return ctx;
}
