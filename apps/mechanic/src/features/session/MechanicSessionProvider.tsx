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
  OPERATIONAL_JOB_STATUSES,
  type JobStatus,
  type MockJob,
} from '@/features/jobs/types';
import { isApiError } from '@/lib/api/errors';
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
import { clearTokens, getAccessToken } from '@/lib/api/tokens';
import type { ApiMechanicMe, ApiMechanicOffer } from '@/lib/api/types';

import { MOCK_MECHANIC, type MockMechanicProfile } from './mock';

const INITIAL_PROFILE: MockMechanicProfile = {
  id: '',
  name: '',
  rating: 0,
  verified: false,
  online: false,
  supportedServices: MOCK_MECHANIC.supportedServices,
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
  signOut: () => Promise<void>;
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
    id: me.id,
    name: name || 'Mechanic',
    online: me.online,
    verified: me.verified,
    rating: Number.isFinite(rating) ? rating : 0,
    supportedServices: MOCK_MECHANIC.supportedServices,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) return error.message || fallback;
  return fallback;
}

const OFFER_POLL_INTERVAL_MS = 2500;

export function MechanicSessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MockMechanicProfile>(INITIAL_PROFILE);
  const [activeJob, setActiveJob] = useState<MockJob | null>(null);
  const [pendingOffer, setPendingOffer] = useState<ApiMechanicOffer | null>(null);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const availabilityBusyRef = useRef(false);
  const pollInFlightRef = useRef(false);
  const pollQueuedRef = useRef(false);

  const incomingJob = useMemo(() => {
    if (!profile.online || activeJob || !pendingOffer) return null;
    return mapOfferToJob(pendingOffer, 'ASSIGNED');
  }, [activeJob, pendingOffer, profile.online]);

  const refreshIncoming = useCallback(async () => {
    if (!(await getAccessToken())) return;
    if (pollInFlightRef.current) {
      pollQueuedRef.current = true;
      return;
    }
    pollInFlightRef.current = true;
    try {
      do {
        pollQueuedRef.current = false;
        const me = await getMechanicMe();
        setProfile(mapMeToProfile(me));
        const [offers, active] = await Promise.all([
          me.online ? listPendingOffers() : Promise.resolve([] as ApiMechanicOffer[]),
          getActiveJob(),
        ]);
        setPendingOffer(me.online ? (offers[0] ?? null) : null);
        setActiveJob((prev) => {
          if (prev?.status === 'COMPLETED') return prev;
          if (active) {
            return mapOfferToJob(
              active,
              jobStatusFromRequest(active.request.status),
            );
          }
          if (
            prev &&
            (OPERATIONAL_JOB_STATUSES as readonly string[]).includes(prev.status)
          ) {
            return prev;
          }
          return null;
        });
      } while (pollQueuedRef.current);
    } catch (error) {
      if (__DEV__) {
        console.warn('[AutoHelp Mechanic] refresh failed', error);
        if (isApiError(error)) {
          console.warn('[AutoHelp Mechanic] status', error.status, 'body', error.body);
        }
      }
    } finally {
      pollInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refreshIncoming();
    const id = setInterval(() => {
      void refreshIncoming();
    }, OFFER_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshIncoming]);

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
      void refreshIncoming();
      return null;
    }
  }, [activeJob, refreshIncoming]);

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

  const signOut = useCallback(async () => {
    await clearTokens();
    setProfile(INITIAL_PROFILE);
    setActiveJob(null);
    setPendingOffer(null);
  }, []);

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
      signOut,
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
      signOut,
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
