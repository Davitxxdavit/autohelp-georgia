import { Alert, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { MechanicCard } from '@/features/services/flow/MechanicCard';
import { Reveal } from '@/features/services/flow/Reveal';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import { useDiagnosticsFlow } from '@/features/services/diagnostics/DiagnosticsFlowProvider';
import {
  formatEstimatedPrice,
  getDiagnosticsOption,
  MOCK_SPECIALIST,
} from '@/features/services/diagnostics/mock';
import { vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function DiagnosticsFoundScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, reset } = useDiagnosticsFlow();
  const { getById } = useVehicles();
  const option = draft.optionId
    ? getDiagnosticsOption(draft.optionId)
    : undefined;
  const vehicle = draft.vehicleId ? getById(draft.vehicleId) : undefined;
  const specialist = MOCK_SPECIALIST;

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
      <ServiceScreenScaffold
        contentContainerStyle={styles.content}
        footer={
          <Reveal delayMs={timing.slow}>
            <View style={styles.footerInner}>
              <PrimaryButton
                label="Track specialist"
                onPress={() => router.replace('/diagnostics/tracking' as Href)}
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
            Specialist found
          </AppText>
        </Reveal>

        <Reveal delayMs={timing.instant}>
          <MechanicCard mechanic={specialist} variant="identity" />
        </Reveal>

        <Reveal delayMs={timing.normal}>
          <View style={styles.eta}>
            <AppText variant="caption" color="textMuted" style={styles.center}>
              Arriving in
            </AppText>
            <AppText variant="h2" style={styles.center}>
              ~{specialist.etaMinutes} min
            </AppText>
          </View>
        </Reveal>

        <Reveal delayMs={timing.slow}>
          <View style={styles.details}>
            <Divider />
            <AppText variant="bodyMedium">Computer diagnostics</AppText>
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
      </ServiceScreenScaffold>
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
