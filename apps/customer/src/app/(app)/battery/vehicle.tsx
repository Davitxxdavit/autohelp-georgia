import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { BatteryScreenHeader } from '@/features/services/battery/components/BatteryScreenHeader';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { BatteryVehiclesEmpty } from '@/features/services/battery/components/BatteryVehiclesEmpty';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { VehicleCard } from '@/features/vehicles/components/VehicleCard';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function BatteryVehicleScreen() {
  const router = useRouter();
  const { vehicles, ready } = useVehicles();
  const { draft, setVehicle } = useBatteryFlow();

  const selectedId = draft.vehicleId;

  return (
    <View style={styles.screen}>
      <BatteryScreenHeader
        title="Your vehicle"
        subtitle="Which car needs battery help?"
      />
      <FadeIn>
        {!ready ? (
          <AppText variant="body" color="textMuted" style={styles.pad}>
            Loading vehicles…
          </AppText>
        ) : vehicles.length === 0 ? (
          <BatteryScreenScaffold contentContainerStyle={styles.empty}>
            <BatteryVehiclesEmpty onAdd={() => router.push('/vehicle/add')} />
          </BatteryScreenScaffold>
        ) : (
          <BatteryScreenScaffold
            contentContainerStyle={styles.content}
            footer={
              <PrimaryButton
                label="Select this vehicle"
                disabled={!selectedId}
                onPress={() => {
                  if (!selectedId) return;
                  router.push('/battery/problem');
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
          </BatteryScreenScaffold>
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
