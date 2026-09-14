import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack, type Href } from 'expo-router';

import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { colors } from '@/theme/colors';

export default function AppLayout() {
  const { hydrated, isApproved } = useMechanicSession();

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!isApproved) {
    return <Redirect href={'/pending' as Href} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="job" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
