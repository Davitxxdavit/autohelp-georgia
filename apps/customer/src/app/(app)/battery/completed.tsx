import { type ReactNode, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { ServiceIcon } from '@/components/automotive/ServiceIcon';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import {
  formatEstimatedPrice,
  getBatteryOption,
} from '@/features/services/battery/mock';
import {
  BATTERY_FLOW_ROUTES,
  assignedMechanicIdentity,
  requestEstimateLabel,
  requestVehicleLine,
} from '@/features/services/flow/requestFlow';
import { useRequestFlowSync } from '@/features/services/flow/useRequestFlowSync';
import { vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import type { ApiServiceRequest } from '@/lib/api/types';
import { runPreset } from '@/animations/transitions';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function formatWhen(iso: string | null): string {
  if (!iso) return new Date().toLocaleString();
  return new Date(iso).toLocaleString();
}

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

export default function BatteryCompletedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, setLiveRequest, markCompleted } = useBatteryFlow();
  const { getById } = useVehicles();
  const vehicle = draft.vehicleId ? getById(draft.vehicleId) : undefined;
  const option = draft.optionId ? getBatteryOption(draft.optionId) : undefined;

  const onRequest = useCallback(
    (req: ApiServiceRequest) => {
      setLiveRequest(req);
      if (req.status === 'COMPLETED') markCompleted(req.completed_at);
    },
    [markCompleted, setLiveRequest],
  );

  const { request } = useRequestFlowSync({
    requestId: draft.serviceRequestId,
    currentPhase: 'completed',
    routes: BATTERY_FLOW_ROUTES,
    onRequest,
  });

  const live = request ?? draft.liveRequest;
  const mechanic = assignedMechanicIdentity(live);
  const vehicleLine =
    requestVehicleLine(live) ??
    (vehicle ? `${vehicleTitle(vehicle)} · ${vehicle.year}` : null);
  const estimate =
    requestEstimateLabel(live) ??
    (option ? formatEstimatedPrice(option) : '—');
  const when = live?.completed_at ?? draft.completedAt;

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
          <PrimaryButton
            label="Rate specialist"
            onPress={() => router.push('/battery/rating')}
          />
        }
      >
        <Reveal delayMs={0}>
          <View style={styles.hero}>
            <View style={styles.mark}>
              <ServiceIcon kind="battery" size={28} />
            </View>
            <AppText variant="label" color="success" style={styles.center}>
              Service completed
            </AppText>
            <AppText variant="h2" style={styles.center}>
              Battery Assistance
            </AppText>
            {option ? (
              <AppText variant="body" color="textSecondary" style={styles.center}>
                {option.title}
              </AppText>
            ) : null}
          </View>
        </Reveal>

        <Reveal delayMs={timing.normal}>
          <View style={styles.details}>
            <Divider />

            {vehicleLine ? (
              <View style={styles.block}>
                <AppText variant="caption" color="textMuted">
                  Your vehicle
                </AppText>
                <AppText variant="bodyMedium">{vehicleLine}</AppText>
              </View>
            ) : null}

            <View style={styles.block}>
              <AppText variant="caption" color="textMuted">
                Specialist
              </AppText>
              <AppText variant="bodyMedium">
                {mechanic?.name ?? 'Specialist'}
              </AppText>
            </View>

            <View style={styles.block}>
              <AppText variant="caption" color="textMuted">
                Estimated price
              </AppText>
              <AppText variant="bodyMedium">{estimate}</AppText>
              <AppText variant="caption" color="textMuted">
                Price is an estimate
              </AppText>
            </View>

            <View style={styles.block}>
              <AppText variant="caption" color="textMuted">
                Date / time
              </AppText>
              <AppText variant="bodyMedium">{formatWhen(when)}</AppText>
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
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
  details: {
    gap: spacing.sm,
  },
  block: {
    gap: spacing.xxs,
    marginTop: spacing.sm,
  },
});
