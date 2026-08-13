import { Stack } from 'expo-router';

import { colors } from '@/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="language" options={{ gestureEnabled: false }} />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen
        name="verify-otp"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
