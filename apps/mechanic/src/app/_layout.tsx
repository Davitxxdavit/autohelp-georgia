import { useEffect } from 'react';
import { Stack, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AndroidNavigationBar } from '@/components/system/AndroidNavigationBar';
import {
  MechanicSessionProvider,
  useMechanicSession,
} from '@/features/session/MechanicSessionProvider';
import { subscribeUnauthorized } from '@/lib/api/client';
import { colors } from '@/theme/colors';

export const unstable_settings = {
  initialRouteName: '(app)',
};

function MechanicAuthListener() {
  const router = useRouter();
  const { signOut } = useMechanicSession();

  useEffect(
    () =>
      subscribeUnauthorized(() => {
        void signOut().then(() => {
          router.replace('/(auth)/login' as Href);
        });
      }),
    [router, signOut],
  );

  return null;
}

export default function RootLayout() {
  return (
    <MechanicSessionProvider>
      <StatusBar style="light" />
      <AndroidNavigationBar />
      <MechanicAuthListener />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="pending" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </MechanicSessionProvider>
  );
}
