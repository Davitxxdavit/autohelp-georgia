import { Stack } from 'expo-router';

import { VehiclesProvider } from '@/features/vehicles/VehiclesProvider';
import { colors } from '@/theme/colors';

export default function AppLayout() {
  return (
    <VehiclesProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="request/[service]"
          options={{
            headerShown: true,
            headerTitle: 'მოთხოვნა',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="request/success"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerShadowVisible: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="vehicle/add"
          options={{
            headerShown: true,
            headerTitle: 'მანქანა',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="vehicle/[id]"
          options={{
            headerShown: true,
            headerTitle: 'მანქანა',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="inspection"
          options={{
            headerShown: true,
            headerTitle: 'ინსპექცია',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </VehiclesProvider>
  );
}
