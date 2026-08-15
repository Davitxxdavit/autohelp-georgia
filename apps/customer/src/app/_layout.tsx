import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthRedirect } from '@/components/auth/AuthRedirect';
import { SessionBootstrap } from '@/components/auth/SessionBootstrap';
import { LaunchGate } from '@/components/branding/LaunchGate';
import { AndroidNavigationBar } from '@/components/system/AndroidNavigationBar';
import { SessionProvider } from '@/services/session/SessionProvider';
import { colors } from '@/theme/colors';

export const unstable_settings = {
  initialRouteName: 'boot',
};

export default function RootLayout() {
  return (
    <SessionProvider>
      <LaunchGate>
        <StatusBar style="light" />
        <AndroidNavigationBar />
        <SessionBootstrap>
          <AuthRedirect />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="boot" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </SessionBootstrap>
      </LaunchGate>
    </SessionProvider>
  );
}
