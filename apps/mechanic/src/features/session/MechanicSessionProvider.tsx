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
import { isMechanicApproved } from '@/lib/api/approval';
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
import { SERVICE_IDS, type ServiceId } from '@/constants/services';

import { type MockMechanicProfile } from './mock';

const INITIAL_PROFILE: MockMechanicProfile = {
  id: '',
  name: '',
  firstName: '',
  phone: '',
  rating: 0,
  verified: false,
  online: false,
  approvalStatus: 'PENDING',
  supportedServices: [],
  services: [],
};

type MechanicSessionValue = {
  profile: MockMechanicProfile;
  hydrated: boolean;
  isApproved: boolean;
  incomingJob: MockJob | null;
  activeJob: MockJob | null;
  availabilityBusy: boolean;
  getJob: (id: string) => MockJob | undefined;
  setOnline: (online: boolean) => Promise<boolean>;
  refreshIncoming: () => Promise<void>;
  checkApproval: () => Promise<boolean>;
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
  const services = me.services ?? [];
  const supportedServices = services
    .map((item) => item.code)
    .filter((code): code is ServiceId =>
      (SERVICE_IDS as readonly string[]).includes(code),
    );
  return {
    id: me.id,
    name: name || me.first_name || 'Mechanic',
    firstName: me.first_name,
    phone: me.phone ?? '',
    online: me.online,
    verified: me.verified,
    approvalStatus: me.approval_status,
    rating: Number.isFinite(rating) ? rating : 0,
    supportedServices,
    services,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) return error.message || fallback;
  return fallback;
}

const OFFER_POLL_INTERVAL_MS = 2500;

export function MechanicSessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<MockMechanicProfile>(INITIAL_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [activeJob, setActiveJob] = useState<MockJob | null>(null);
  const [pendingOffer, setPendingOffer] = useState<ApiMechanicOffer | null>(null);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const availabilityBusyRef = useRef(false);
  const pollInFlightRef = useRef(false);
  const pollQueuedRef = useRef(false);

  const incomingJob = useMemo(() => {
    if (!isApproved || !profile.online || activeJob || !pendingOffer) return null;
    return mapOfferToJob(pendingOffer, 'ASSIGNED');
  }, [activeJob, isApproved, pendingOffer, profile.online]);

  const applyMe = useCallback((me: ApiMechanicMe) => {
    setProfile(mapMeToProfile(me));
    const approved = isMechanicApproved(me);
    setIsApproved(approved);
    return approved;
  }, []);

  const checkApproval = useCallback(async (): Promise<boolean> => {
    const me = await getMechanicMe();
    const approved = applyMe(me);
    setHydrated(true);
    if (!approved) {
      setPendingOffer(null);
      setActiveJob(null);
    }
    return approved;
  }, [applyMe]);

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
        const approved = applyMe(me);
        setHydrated(true);
        if (!approved) {
          setPendingOffer(null);
          setActiveJob(null);
          return;
        }
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
      setHydrated(true);
      if (__DEV__) {
        console.warn('[AutoHelp Mechanic] refresh failed', error);
        if (isApiError(error)) {
          console.warn('[AutoHelp Mechanic] status', error.status, 'body', error.body);
        }
      }
    } finally {
      pollInFlightRef.current = false;
    }
  }, [applyMe]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const token = await getAccessToken();
      if (!mounted) return;
      if (!token) {
        setHydrated(true);
        setIsApproved(false);
        return;
      }
      try {
        await checkApproval();
      } catch {
        if (mounted) {
          setHydrated(true);
          setIsApproved(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [checkApproval]);

  useEffect(() => {
    if (!hydrated || !isApproved) return;
    void refreshIncoming();
    const id = setInterval(() => {
      void refreshIncoming();
    }, OFFER_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hydrated, isApproved, refreshIncoming]);

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
        applyMe(me);
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
    [applyMe, profile.online, refreshIncoming],
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
    setIsApproved(false);
    setHydrated(true);
  }, []);

  const value = useMemo<MechanicSessionValue>(
    () => ({
      profile,
      hydrated,
      isApproved,
      incomingJob,
      activeJob,
      availabilityBusy,
      getJob,
      setOnline,
      refreshIncoming,
      checkApproval,
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
      checkApproval,
      declineJob,
      finishJob,
      getJob,
      hydrated,
      incomingJob,
      isApproved,
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
