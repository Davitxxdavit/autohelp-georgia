import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AndroidNavigationBar } from '@/components/system/AndroidNavigationBar';
import { MechanicSessionProvider } from '@/features/session/MechanicSessionProvider';
import { colors } from '@/theme/colors';

export const unstable_settings = {
  initialRouteName: '(app)',
};

export default function RootLayout() {
  return (
    <MechanicSessionProvider>
      <StatusBar style="light" />
      <AndroidNavigationBar />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </MechanicSessionProvider>
  );
}
