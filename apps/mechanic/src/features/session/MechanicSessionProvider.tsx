import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { mapOfferToJob, jobStatusFromRequest } from '@/features/jobs/mapOffer';
import {
  JOB_STATUS_TRANSITIONS,
  type JobStatus,
  type MockJob,
} from '@/features/jobs/types';
import { isApiError } from '@/lib/api/errors';
import { obtainDevelopmentJwt } from '@/lib/api/devAuth';
import {
  acceptOffer,
  declineOffer,
  getActiveJob,
  listPendingOffers,
} from '@/lib/api/mechanic';
import type { ApiMechanicOffer } from '@/lib/api/types';

import { MOCK_MECHANIC, type MockMechanicProfile } from './mock';

type MechanicSessionValue = {
  profile: MockMechanicProfile;
  incomingJob: MockJob | null;
  activeJob: MockJob | null;
  getJob: (id: string) => MockJob | undefined;
  setOnline: (online: boolean) => void;
  refreshIncoming: () => Promise<void>;
  acceptJob: (id: string) => Promise<MockJob | null>;
  declineJob: (id: string) => Promise<boolean>;
  updateJobStatus: (jobId: string, status: JobStatus) => MockJob | null;
  finishJob: () => boolean;
};

const MechanicSessionContext = createContext<MechanicSessionValue | null>(null);

export function MechanicSessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MockMechanicProfile>(MOCK_MECHANIC);
  const [activeJob, setActiveJob] = useState<MockJob | null>(null);
  const [pendingOffer, setPendingOffer] = useState<ApiMechanicOffer | null>(null);

  const incomingJob = useMemo(() => {
    if (!profile.online || activeJob || !pendingOffer) return null;
    return mapOfferToJob(pendingOffer, 'ASSIGNED');
  }, [activeJob, pendingOffer, profile.online]);

  const refreshIncoming = useCallback(async () => {
    try {
      const [offers, active] = await Promise.all([
        listPendingOffers(),
        getActiveJob(),
      ]);
      setPendingOffer(offers[0] ?? null);
      setActiveJob((prev) => {
        if (prev) return prev;
        if (!active) return null;
        return mapOfferToJob(
          active,
          jobStatusFromRequest(active.request.status),
        );
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[AutoHelp Mechanic] refresh failed', error);
        if (isApiError(error)) {
          console.warn('[AutoHelp Mechanic] status', error.status, 'body', error.body);
        }
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      await obtainDevelopmentJwt();
      if (!mounted) return;
      try {
        const [offers, active] = await Promise.all([
          listPendingOffers(),
          getActiveJob(),
        ]);
        if (!mounted) return;
        setPendingOffer(offers[0] ?? null);
        if (active) {
          setActiveJob((prev) =>
            prev ?? mapOfferToJob(active, jobStatusFromRequest(active.request.status)),
          );
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[AutoHelp Mechanic] initial load failed', error);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
  }, []);

  const acceptJob = useCallback(async (id: string): Promise<MockJob | null> => {
    if (activeJob?.id === id) return activeJob;
    try {
      const accepted = await acceptOffer(id);
      const next = mapOfferToJob(accepted, 'ACCEPTED');
      setActiveJob(next);
      setPendingOffer(null);
      return next;
    } catch (error) {
      if (__DEV__) {
        console.warn('[AutoHelp Mechanic] accept failed', error);
        if (isApiError(error)) {
          console.warn('[AutoHelp Mechanic] status', error.status, 'body', error.body);
        }
      }
      return null;
    }
  }, [activeJob]);

  const declineJob = useCallback(async (id: string): Promise<boolean> => {
    if (activeJob?.id === id) return false;
    try {
      await declineOffer(id);
      setPendingOffer(null);
      return true;
    } catch (error) {
      if (__DEV__) {
        console.warn('[AutoHelp Mechanic] decline failed', error);
        if (isApiError(error)) {
          console.warn('[AutoHelp Mechanic] status', error.status, 'body', error.body);
        }
      }
      return false;
    }
  }, [activeJob]);

  const updateJobStatus = useCallback(
    (jobId: string, status: JobStatus): MockJob | null => {
      if (!activeJob || activeJob.id !== jobId) return null;
      if (JOB_STATUS_TRANSITIONS[activeJob.status] !== status) return null;
      const next = { ...activeJob, status };
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
      refreshIncoming,
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
      refreshIncoming,
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
