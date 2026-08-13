import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { Surface } from '@/components/ui/Surface';
import { timing } from '@/animations/timing';
import { fuelLabel, vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function VehicleDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById } = useVehicles();
  const vehicle = typeof id === 'string' ? getById(id) : undefined;
  const reducedMotion = useReducedMotion();
  const heroOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const heroY = useSharedValue(reducedMotion ? 0 : 16);

  useEffect(() => {
    if (!vehicle || reducedMotion) {
      heroOpacity.value = 1;
      heroY.value = 0;
      return;
    }
    const ease = Easing.bezier(0.16, 1, 0.3, 1);
    heroOpacity.value = withTiming(1, { duration: timing.entrance, easing: ease });
    heroY.value = withTiming(0, { duration: timing.entrance, easing: ease });
  }, [heroOpacity, heroY, reducedMotion, vehicle]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));

  if (!vehicle) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <AppText variant="body" color="textSecondary">
          მანქანა ვერ მოიძებნა
        </AppText>
      </View>
    );
  }

  const meta = [
    String(vehicle.year),
    vehicle.engine?.trim() || undefined,
    fuelLabel(vehicle.fuel),
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <>
      <Stack.Screen options={{ title: vehicleTitle(vehicle), headerShown: true }} />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            flexGrow: 1,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces
        overScrollMode="auto"
      >
        <Animated.View style={heroStyle}>
          <GradientSurface
            colors={[colors.surfaceElevated, colors.background, colors.primarySoft]}
            radiusToken="xl"
            style={styles.hero}
          >
            <CarSilhouette width={240} height={78} />
            <AppText variant="h2">{vehicle.make}</AppText>
            <AppText variant="h1">{vehicle.model}</AppText>
            <AppText variant="body" color="textSecondary">
              {meta}
            </AppText>
            {vehicle.isPrimary ? (
              <View style={styles.primaryRow}>
                <View style={styles.primaryDot} />
                <AppText variant="caption" color="primary">
                  ძირითადი მანქანა
                </AppText>
              </View>
            ) : null}
          </GradientSurface>
        </Animated.View>

        <Surface elevated padded style={styles.section}>
          <AppText variant="label" color="textMuted">
            მანქანის ინფორმაცია
          </AppText>
          <InfoRow label="საწვავი" value={fuelLabel(vehicle.fuel)} />
          <Divider />
          <InfoRow label="ძრავი" value={vehicle.engine || '—'} />
          <Divider />
          <InfoRow label="წელი" value={String(vehicle.year)} />
          <Divider />
          <InfoRow label="მარკა" value={vehicle.make} />
          <Divider />
          <InfoRow label="მოდელი" value={vehicle.model} />
        </Surface>

        <Surface elevated padded style={styles.section}>
          <AppText variant="label" color="textMuted">
            სერვისის ისტორია
          </AppText>
          <View style={styles.historyEmpty}>
            <View style={styles.historyIcon}>
              <CarSilhouette width={120} height={40} color={colors.textMuted} />
            </View>
            <AppText variant="bodyMedium">სერვისის ისტორია ჯერ ცარიელია</AppText>
            <AppText variant="caption" color="textSecondary" style={styles.historyCopy}>
              შეკვეთების შესრულების შემდეგ შენი მანქანის სერვისის ისტორია აქ
              გამოჩნდება.
            </AppText>
          </View>
        </Surface>

        <PrimaryButton
          label="რედაქტირება"
          onPress={() => {
            router.push({
              pathname: '/vehicle/add',
              params: { editId: vehicle.id },
            });
          }}
        />
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="bodyMedium">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  primaryDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  section: {
    gap: spacing.sm,
  },
  infoRow: {
    gap: spacing.xxs,
  },
  historyEmpty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  historyIcon: {
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  historyCopy: {
    textAlign: 'center',
  },
});
