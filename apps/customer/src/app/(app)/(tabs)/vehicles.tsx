import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { VehicleCard } from '@/features/vehicles/components/VehicleCard';
import { VehiclesEmpty } from '@/features/vehicles/components/VehiclesEmpty';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function VehiclesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { ready, vehicles, remove, setPrimary } = useVehicles();

  const openAdd = () => {
    router.push('/vehicle/add');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.header}>
        <AppText variant="h2" style={styles.title}>
          ჩემი მანქანები
        </AppText>
        {vehicles.length > 0 ? (
          <AnimatedPressable
            accessibilityLabel="მანქანის დამატება"
            onPress={openAdd}
            style={styles.addChip}
          >
            <AppText variant="button" color="primary">
              + დამატება
            </AppText>
          </AnimatedPressable>
        ) : null}
      </View>

      {!ready ? (
        <AppText variant="body" color="textMuted">
          იტვირთება…
        </AppText>
      ) : vehicles.length === 0 ? (
        <ScrollView
          contentContainerStyle={[
            styles.emptyScroll,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          <VehiclesEmpty onAdd={openAdd} />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          bounces
          overScrollMode="auto"
        >
          {vehicles.map((vehicle, index) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              index={index}
              onPress={() => {
                router.push({
                  pathname: '/vehicle/[id]',
                  params: { id: vehicle.id },
                });
              }}
              onEdit={() => {
                router.push({
                  pathname: '/vehicle/add',
                  params: { editId: vehicle.id },
                });
              }}
              onDelete={() => {
                void remove(vehicle.id);
              }}
              onSelectPrimary={() => {
                void setPrimary(vehicle.id);
              }}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flex: 1,
  },
  addChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  list: {
    gap: spacing.md,
    flexGrow: 1,
  },
  emptyScroll: {
    flexGrow: 1,
  },
});
