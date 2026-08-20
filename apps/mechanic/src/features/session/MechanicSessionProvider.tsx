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
import { Alert } from 'react-native';

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
  getMechanicMe,
  listPendingOffers,
  patchMechanicMe,
  transitionJob,
  type MechanicJobAction,
} from '@/lib/api/mechanic';
import type { ApiMechanicMe, ApiMechanicOffer } from '@/lib/api/types';

import { MOCK_MECHANIC, type MockMechanicProfile } from './mock';

const INITIAL_PROFILE: MockMechanicProfile = {
  ...MOCK_MECHANIC,
  online: false,
};

type MechanicSessionValue = {
  profile: MockMechanicProfile;
  incomingJob: MockJob | null;
  activeJob: MockJob | null;
  availabilityBusy: boolean;
  getJob: (id: string) => MockJob | undefined;
  setOnline: (online: boolean) => Promise<boolean>;
  refreshIncoming: () => Promise<void>;
  acceptJob: (id: string) => Promise<MockJob | null>;
  declineJob: (id: string) => Promise<boolean>;
  updateJobStatus: (jobId: string, status: JobStatus) => Promise<MockJob | null>;
  finishJob: () => boolean;
};

const MechanicSessionContext = createContext<MechanicSessionValue | null>(null);

function actionForStatus(status: JobStatus): MechanicJobAction | null {
  if (status === 'ON_THE_WAY') return 'start-driving';
  if (status === 'ARRIVED') return 'arrive';
  if (status === 'IN_PROGRESS') return 'start-service';
  if (status === 'COMPLETED') return 'complete';
  return null;
}

function mapMeToProfile(me: ApiMechanicMe): MockMechanicProfile {
  const name = [me.first_name, me.last_name].filter(Boolean).join(' ').trim();
  const rating = Number.parseFloat(String(me.rating_average));
  return {
    ...MOCK_MECHANIC,
    id: me.id,
    name: name || MOCK_MECHANIC.name,
    online: me.online,
    verified: me.verified,
    rating: Number.isFinite(rating) ? rating : MOCK_MECHANIC.rating,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) return error.message || fallback;
  return fallback;
}

export function MechanicSessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MockMechanicProfile>(INITIAL_PROFILE);
  const [activeJob, setActiveJob] = useState<MockJob | null>(null);
  const [pendingOffer, setPendingOffer] = useState<ApiMechanicOffer | null>(null);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const availabilityBusyRef = useRef(false);

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
        if (prev?.status === 'COMPLETED') return prev;
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
        const me = await getMechanicMe();
        if (!mounted) return;
        setProfile(mapMeToProfile(me));
      } catch (error) {
        if (__DEV__) {
          console.warn('[AutoHelp Mechanic] profile load failed', error);
        }
      }
      if (!mounted) return;
      try {
        const [offers, active] = await Promise.all([
          listPendingOffers(),
          getActiveJob(),
        ]);
        if (!mounted) return;
        setPendingOffer(offers[0] ?? null);
        if (active) {
          setActiveJob(
            mapOfferToJob(active, jobStatusFromRequest(active.request.status)),
          );
        } else {
          setActiveJob(null);
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
      if (activeJob?.id === id || activeJob?.requestId === id) return activeJob;
      if (incomingJob?.id === id || incomingJob?.requestId === id) {
        return incomingJob;
      }
      return undefined;
    },
    [activeJob, incomingJob],
  );

  const setOnline = useCallback(
    async (online: boolean): Promise<boolean> => {
      if (availabilityBusyRef.current) return false;
      if (profile.online === online) return true;
      availabilityBusyRef.current = true;
      setAvailabilityBusy(true);
      try {
        const me = await patchMechanicMe({ online });
        setProfile(mapMeToProfile(me));
        await refreshIncoming();
        return true;
      } catch (error) {
        Alert.alert(
          'Could not update availability',
          errorMessage(
            error,
            'Keep the current Online/Offline state and try again.',
          ),
        );
        return false;
      } finally {
        availabilityBusyRef.current = false;
        setAvailabilityBusy(false);
      }
    },
    [profile.online, refreshIncoming],
  );

  const acceptJob = useCallback(async (id: string): Promise<MockJob | null> => {
    if (activeJob?.id === id) return activeJob;
    try {
      const accepted = await acceptOffer(id);
      const next = mapOfferToJob(
        accepted,
        jobStatusFromRequest(accepted.request.status),
      );
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
    async (jobId: string, status: JobStatus): Promise<MockJob | null> => {
      if (!activeJob) return null;
      if (activeJob.id !== jobId && activeJob.requestId !== jobId) return null;
      if (JOB_STATUS_TRANSITIONS[activeJob.status] !== status) return null;
      const action = actionForStatus(status);
      if (!action) return null;
      try {
        const offer = await transitionJob(activeJob.requestId, action);
        const next = mapOfferToJob(
          offer,
          jobStatusFromRequest(offer.request.status),
        );
        setActiveJob(next);
        if (next.status === 'COMPLETED') {
          setPendingOffer(null);
        }
        return next;
      } catch (error) {
        Alert.alert(
          'Could not update job',
          errorMessage(
            error,
            'The job stage was not changed. Try again.',
          ),
        );
        return null;
      }
    },
    [activeJob],
  );

  const finishJob = useCallback((): boolean => {
    if (!activeJob || activeJob.status !== 'COMPLETED') return false;
    setActiveJob(null);
    void refreshIncoming();
    return true;
  }, [activeJob, refreshIncoming]);

  const value = useMemo<MechanicSessionValue>(
    () => ({
      profile,
      incomingJob,
      activeJob,
      availabilityBusy,
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
      availabilityBusy,
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
