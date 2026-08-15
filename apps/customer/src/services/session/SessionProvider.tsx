import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { LanguageId } from '@/constants/languages';
import { resetAppState } from '@/services/storage/reset';

import {
  readSession,
  writeLanguage,
  writeMockAuthenticated,
  writeOnboardingCompleted,
  clearMockAuthenticated,
} from './storage';
import {
  EMPTY_SESSION,
  resolveSessionDestination,
  type SessionDestination,
  type SessionSnapshot,
} from './types';

type SessionContextValue = {
  /** True until AsyncStorage session has been read once */
  isLoading: boolean;
  /** Alias: session hydration in progress */
  initializing: boolean;
  /** Alias: !isLoading */
  ready: boolean;
  session: SessionSnapshot;
  destination: SessionDestination;
  setLanguage: (language: LanguageId) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  /** MOCK — marks user authenticated locally after fake OTP */
  mockSignIn: (phone: string) => Promise<void>;
  mockSignOut: () => Promise<void>;
  /**
   * DEV ONLY — clears language / onboarding / mock auth and resets in-memory session.
   * No-op outside __DEV__.
   */
  resetAppStateForDev: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<SessionSnapshot>(EMPTY_SESSION);

  useEffect(() => {
    let mounted = true;
    readSession()
      .then((snapshot) => {
        if (mounted) {
          setSession(snapshot);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setSession(EMPTY_SESSION);
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (language: LanguageId) => {
    await writeLanguage(language);
    setSession((prev) => ({ ...prev, language, languageSelected: true }));
  }, []);

  const completeOnboarding = useCallback(async () => {
    await writeOnboardingCompleted();
    setSession((prev) => ({ ...prev, onboardingCompleted: true }));
  }, []);

  const mockSignIn = useCallback(async (phone: string) => {
    await writeMockAuthenticated(phone);
    setSession((prev) => ({
      ...prev,
      authenticated: true,
      phone,
    }));
  }, []);

  const mockSignOut = useCallback(async () => {
    await clearMockAuthenticated();
    setSession((prev) => ({
      ...prev,
      authenticated: false,
      phone: null,
    }));
  }, []);

  const resetAppStateForDev = useCallback(async () => {
    if (!__DEV__) return;
    await resetAppState();
    setSession(EMPTY_SESSION);
  }, []);

  const ready = !isLoading;
  const initializing = isLoading;

  const value = useMemo<SessionContextValue>(
    () => ({
      isLoading,
      initializing,
      ready,
      session,
      destination: resolveSessionDestination(session),
      setLanguage,
      completeOnboarding,
      mockSignIn,
      mockSignOut,
      resetAppStateForDev,
    }),
    [
      isLoading,
      initializing,
      ready,
      session,
      setLanguage,
      completeOnboarding,
      mockSignIn,
      mockSignOut,
      resetAppStateForDev,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}
