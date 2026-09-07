import { useEffect } from 'react';
import { useRouter, useRootNavigationState, useSegments } from 'expo-router';

import { useLaunchGate } from '@/components/branding/LaunchGate';
import { useSession } from '@/services/session/SessionProvider';

function authScreen(
  group: string | undefined,
  screen: string | undefined,
): 'language' | 'onboarding' | 'login' | 'register' | 'otp' | null {
  if (group !== '(auth)') return null;
  if (screen === 'language') return 'language';
  if (screen === 'onboarding') return 'onboarding';
  if (screen === 'login') return 'login';
  if (screen === 'register') return 'register';
  if (screen === 'verify-otp') return 'otp';
  return null;
}

/**
 * Sequential gate. Forward navigation from language / onboarding / login
 * is owned by those screens so AuthRedirect cannot skip to Home.
 *
 * Launch → language → onboarding → login → home
 */
export function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { initializing, session } = useSession();
  const { launchComplete } = useLaunchGate();

  useEffect(() => {
    if (initializing) return;
    if (!launchComplete) return;
    if (!navigationState?.key) return;

    const group = segments[0] as string | undefined;
    const screen = segments[1] as string | undefined;
    const current = authScreen(group, screen);
    const atApp = group === '(app)';

    // 1. Language is always first when unconfirmed — never onboarding/home.
    if (!session.languageSelected) {
      if (current !== 'language') {
        router.replace('/(auth)/language');
      }
      return;
    }

    // 2. Just confirmed language: always onboarding. Never Home.
    if (current === 'language') {
      router.replace('/(auth)/onboarding');
      return;
    }

    // 3. Onboarding carousel owns its own forward nav (slides 1→2→3→login).
    if (current === 'onboarding') {
      return;
    }

    if (!session.onboardingCompleted) {
      router.replace('/(auth)/onboarding');
      return;
    }

    // 4. Login / register own forward nav to Home after JWT sign-in.
    if (current === 'login' || current === 'register' || current === 'otp') {
      if (session.authenticated && current === 'otp') {
        return;
      }
      if (!session.authenticated) {
        return;
      }
    }

    if (!session.authenticated) {
      if (
        current !== 'login' &&
        current !== 'register' &&
        current !== 'otp'
      ) {
        router.replace('/(auth)/login');
      }
      return;
    }

    if (!atApp) {
      router.replace('/(app)/(tabs)');
    }
  }, [
    initializing,
    launchComplete,
    navigationState?.key,
    router,
    segments,
    session,
  ]);

  return null;
}
