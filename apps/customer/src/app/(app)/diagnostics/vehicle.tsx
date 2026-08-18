import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { FadeIn } from '@/features/services/flow/FadeIn';
import { ServiceScreenHeader } from '@/features/services/flow/ServiceScreenHeader';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import { VehiclesEmpty } from '@/features/services/flow/VehiclesEmpty';
import { useDiagnosticsFlow } from '@/features/services/diagnostics/DiagnosticsFlowProvider';
import { VehicleCard } from '@/features/vehicles/components/VehicleCard';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function DiagnosticsVehicleScreen() {
  const router = useRouter();
  const { vehicles, ready } = useVehicles();
  const { draft, setVehicle } = useDiagnosticsFlow();

  const selectedId = draft.vehicleId;

  return (
    <View style={styles.screen}>
      <ServiceScreenHeader
        title="Your vehicle"
        subtitle="Which car needs a diagnostic check?"
      />
      <FadeIn>
        {!ready ? (
          <AppText variant="body" color="textMuted" style={styles.pad}>
            Loading vehicles…
          </AppText>
        ) : vehicles.length === 0 ? (
          <ServiceScreenScaffold contentContainerStyle={styles.empty}>
            <VehiclesEmpty onAdd={() => router.push('/vehicle/add')} />
          </ServiceScreenScaffold>
        ) : (
          <ServiceScreenScaffold
            contentContainerStyle={styles.content}
            footer={
              <PrimaryButton
                label="Select this vehicle"
                disabled={!selectedId}
                onPress={() => {
                  if (!selectedId) return;
                  router.push('/diagnostics/problem' as Href);
                }}
              />
            }
          >
            {vehicles.map((vehicle, index) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                index={index}
                compact
                selected={selectedId === vehicle.id}
                onPress={() => setVehicle(vehicle.id)}
              />
            ))}
            <AnimatedPressable
              accessibilityLabel="Add vehicle"
              onPress={() => router.push('/vehicle/add')}
              style={styles.add}
            >
              <AppText variant="button" color="primary">
                + Add vehicle
              </AppText>
            </AnimatedPressable>
          </ServiceScreenScaffold>
        )}
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pad: {
    paddingHorizontal: spacing.xl,
  },
  empty: {
    paddingHorizontal: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    flexGrow: 0,
  },
  add: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
});
