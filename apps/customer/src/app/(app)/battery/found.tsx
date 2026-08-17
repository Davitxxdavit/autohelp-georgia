import { type ReactNode, useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { MechanicCard } from '@/features/services/battery/components/MechanicCard';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import {
  formatEstimatedPrice,
  getBatteryOption,
  MOCK_MECHANIC,
} from '@/features/services/battery/mock';
import { vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { runPreset } from '@/animations/transitions';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

function Reveal({
  delayMs,
  children,
}: {
  delayMs: number;
  children: ReactNode;
}) {
  const reducedMotion = !!useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 16);

  useEffect(() => {
    runPreset('fadeInUp', { opacity, translateY }, { reducedMotion, delayMs });
  }, [delayMs, opacity, reducedMotion, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function BatteryFoundScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, reset } = useBatteryFlow();
  const { getById } = useVehicles();
  const option = draft.optionId ? getBatteryOption(draft.optionId) : undefined;
  const vehicle = draft.vehicleId ? getById(draft.vehicleId) : undefined;
  const mechanic = MOCK_MECHANIC;

  const onCancel = () => {
    Alert.alert('Cancel request?', 'This mock request will be closed.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: () => {
          reset();
          router.replace('/(app)/(tabs)');
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing['2xl'] },
      ]}
    >
      <BatteryScreenScaffold
        contentContainerStyle={styles.content}
        footer={
          <Reveal delayMs={timing.slow}>
            <View style={styles.footerInner}>
              <PrimaryButton
                label="Track specialist"
                onPress={() => router.replace('/battery/tracking')}
              />
              <AnimatedPressable
                accessibilityLabel="Cancel request"
                onPress={onCancel}
                style={styles.cancel}
              >
                <AppText variant="button" color="textSecondary">
                  Cancel request
                </AppText>
              </AnimatedPressable>
            </View>
          </Reveal>
        }
      >
        <Reveal delayMs={0}>
          <AppText variant="label" color="primary" style={styles.center}>
            Mechanic found
          </AppText>
        </Reveal>

        <Reveal delayMs={timing.instant}>
          <MechanicCard mechanic={mechanic} variant="identity" />
        </Reveal>

        <Reveal delayMs={timing.normal}>
          <View style={styles.eta}>
            <AppText variant="caption" color="textMuted" style={styles.center}>
              Arriving in
            </AppText>
            <AppText variant="h2" style={styles.center}>
              ~{mechanic.etaMinutes} min
            </AppText>
          </View>
        </Reveal>

        <Reveal delayMs={timing.slow}>
          <View style={styles.details}>
            <Divider />
            <AppText variant="bodyMedium">Battery Assistance</AppText>
            {option ? (
              <AppText variant="caption" color="textSecondary">
                {option.title}
              </AppText>
            ) : null}

            {vehicle ? (
              <View style={styles.block}>
                <AppText variant="caption" color="textMuted">
                  Your vehicle
                </AppText>
                <AppText variant="bodyMedium">
                  {vehicleTitle(vehicle)} · {vehicle.year}
                </AppText>
              </View>
            ) : null}

            <View style={styles.block}>
              <AppText variant="caption" color="textMuted">
                Estimated price
              </AppText>
              <AppText variant="bodyMedium">
                {option ? formatEstimatedPrice(option) : '—'}
              </AppText>
              <AppText variant="caption" color="textMuted">
                Price is an estimate
              </AppText>
            </View>
          </View>
        </Reveal>
      </BatteryScreenScaffold>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    flexGrow: 0,
  },
  center: {
    textAlign: 'center',
  },
  eta: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  details: {
    gap: spacing.sm,
  },
  block: {
    gap: spacing.xxs,
    marginTop: spacing.sm,
  },
  footerInner: {
    gap: spacing.md,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
