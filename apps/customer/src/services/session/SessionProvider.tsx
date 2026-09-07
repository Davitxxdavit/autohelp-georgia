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
import { obtainTokenPair, refreshTokenPair, registerCustomer } from '@/lib/api/auth';
import { subscribeUnauthorized } from '@/lib/api/client';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokenPair,
} from '@/lib/api/tokens';
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
  /** JWT phone + password. Production auth will move to phone OTP. */
  signInWithPassword: (phone: string, password: string) => Promise<void>;
  registerWithPassword: (args: {
    phone: string;
    password: string;
    firstName: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * DEV ONLY — clears language / onboarding / mock auth and resets in-memory session.
   * No-op outside __DEV__.
   */
  resetAppStateForDev: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

async function restoreJwtSession(): Promise<boolean> {
  if (await getAccessToken()) return true;
  const refresh = await getRefreshToken();
  if (!refresh) return false;
  try {
    const data = await refreshTokenPair(refresh);
    await setAccessToken(data.access);
    return true;
  } catch {
    return false;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<SessionSnapshot>(EMPTY_SESSION);

  useEffect(() => {
    let mounted = true;
    readSession()
      .then(async (snapshot) => {
        let next = snapshot;
        if (snapshot.authenticated) {
          const restored = await restoreJwtSession();
          if (!restored) {
            await clearMockAuthenticated();
            await clearTokens();
            next = { ...snapshot, authenticated: false, phone: null };
          }
        }
        if (mounted) {
          setSession(next);
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

  const applyAuthenticatedSession = useCallback(
    async (phone: string, tokens: { access: string; refresh: string }) => {
      await setTokenPair(tokens);
      await writeMockAuthenticated(phone);
      setSession((prev) => ({
        ...prev,
        authenticated: true,
        phone,
      }));
    },
    [],
  );

  const signInWithPassword = useCallback(async (phone: string, password: string) => {
    const tokens = await obtainTokenPair({ phone, password });
    await applyAuthenticatedSession(phone, tokens);
  }, [applyAuthenticatedSession]);

  const registerWithPassword = useCallback(
    async (args: { phone: string; password: string; firstName: string }) => {
      const created = await registerCustomer({
        phone: args.phone,
        password: args.password,
        first_name: args.firstName,
      });
      await applyAuthenticatedSession(args.phone, {
        access: created.access,
        refresh: created.refresh,
      });
    },
    [applyAuthenticatedSession],
  );

  const signOut = useCallback(async () => {
    await clearMockAuthenticated();
    await clearTokens();
    setSession((prev) => ({
      ...prev,
      authenticated: false,
      phone: null,
    }));
  }, []);

  useEffect(() => subscribeUnauthorized(() => {
    void signOut();
  }), [signOut]);

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
      signInWithPassword,
      registerWithPassword,
      signOut,
      resetAppStateForDev,
    }),
    [
      isLoading,
      initializing,
      ready,
      session,
      setLanguage,
      completeOnboarding,
      signInWithPassword,
      registerWithPassword,
      signOut,
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
