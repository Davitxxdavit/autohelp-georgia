import { Stack } from 'expo-router';

import { KeysFlowProvider } from '@/features/services/keys/KeysFlowProvider';
import { colors } from '@/theme/colors';

export default function KeysLayout() {
  return (
    <KeysFlowProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="vehicle" />
        <Stack.Screen name="location" />
        <Stack.Screen name="summary" />
        <Stack.Screen
          name="searching"
          options={{ gestureEnabled: false, animation: 'fade' }}
        />
        <Stack.Screen name="found" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="tracking"
          options={{ gestureEnabled: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="completed"
          options={{ gestureEnabled: false, animation: 'fade' }}
        />
        <Stack.Screen name="rating" options={{ gestureEnabled: false }} />
      </Stack>
    </KeysFlowProvider>
  );
}
