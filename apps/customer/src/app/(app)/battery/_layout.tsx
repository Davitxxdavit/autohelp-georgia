import { Stack } from 'expo-router';

import { BatteryFlowProvider } from '@/features/services/battery/BatteryFlowProvider';
import { colors } from '@/theme/colors';

export default function BatteryLayout() {
  return (
    <BatteryFlowProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="vehicle" />
        <Stack.Screen name="problem" />
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
    </BatteryFlowProvider>
  );
}
