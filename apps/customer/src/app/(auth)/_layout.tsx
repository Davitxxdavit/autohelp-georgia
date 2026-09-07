import { Stack } from 'expo-router';

import { useSession } from '@/services/session/SessionProvider';
import { colors } from '@/theme/colors';

export const unstable_settings = {
  initialRouteName: 'language',
};

export default function AuthLayout() {
  const { session } = useSession();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="language" options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="onboarding"
        options={{ gestureEnabled: false }}
        redirect={!session.languageSelected}
      />
      <Stack.Screen name="login" options={{ gestureEnabled: false }} />
      <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="verify-otp"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
