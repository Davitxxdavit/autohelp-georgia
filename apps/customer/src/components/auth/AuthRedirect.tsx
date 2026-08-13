import { useEffect } from 'react';
import { useRouter, useRootNavigationState, useSegments } from 'expo-router';

import { useSession } from '@/services/session/SessionProvider';
import {
  resolveSessionDestination,
  type SessionDestination,
} from '@/services/session/types';

function isAtDestination(
  destination: SessionDestination,
  group: string | undefined,
  screen: string | undefined,
): boolean {
  if (destination === '/(auth)/language') {
    return group === '(auth)' && screen === 'language';
  }
  if (destination === '/(auth)/onboarding') {
    return group === '(auth)' && screen === 'onboarding';
  }
  if (destination === '/(auth)/login') {
    return group === '(auth)' && (screen === 'login' || screen === 'verify-otp');
  }
  return group === '(app)';
}

/**
 * Language-first gate. Waits until:
 * 1) session isLoading === false
 * 2) root navigation container is ready
 * before calling router.replace.
 *
 * Priority: language → onboarding → login → app
 */
export function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { isLoading, session } = useSession();

  useEffect(() => {
    if (isLoading) return;
    if (!navigationState?.key) return;

    const destination = resolveSessionDestination(session);
    const group = segments[0] as string | undefined;
    const screen = segments[1] as string | undefined;

    if (
      group === '(auth)' &&
      screen === 'verify-otp' &&
      session.language &&
      session.onboardingCompleted &&
      !session.authenticated
    ) {
      return;
    }

    if (isAtDestination(destination, group, screen)) {
      return;
    }

    router.replace(destination);
  }, [isLoading, navigationState?.key, router, segments, session]);

  return null;
}
