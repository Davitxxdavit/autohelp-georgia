import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
} from '@/features/services/battery/mock';
import {
  RequestMissingState,
  RequestPollHint,
} from '@/features/services/flow/RequestSyncNotice';
import { CallMechanicButton } from '@/features/services/flow/CallMechanicButton';
import { promptCancelRoadsideRequest } from '@/features/services/flow/cancelRequest';
import { PriceQuoteCard } from '@/features/services/flow/PriceQuoteCard';
import { LiveJobMap } from '@/features/maps/LiveJobMap';
import { mechanicPointFromRequest } from '@/features/services/flow/TripLivePanel';
import {
  BATTERY_FLOW_ROUTES,
  assignedMechanicIdentity,
  customerPointFromLiveOrDraft,
  requestEstimateLabel,
  requestVehicleLine,
} from '@/features/services/flow/requestFlow';
import { useRequestFlowSync } from '@/features/services/flow/useRequestFlowSync';
import { vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { customerCanCancel } from '@/lib/api/status';
import type { ApiServiceRequest } from '@/lib/api/types';
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
  const { draft, reset, setLiveRequest, markCompleted } = useBatteryFlow();
  const { getById } = useVehicles();
  const option = draft.optionId ? getBatteryOption(draft.optionId) : undefined;
  const vehicle = draft.vehicleId ? getById(draft.vehicleId) : undefined;

  const onRequest = useCallback(
    (req: ApiServiceRequest) => {
      setLiveRequest(req);
      if (req.status === 'COMPLETED') markCompleted(req.completed_at);
    },
    [markCompleted, setLiveRequest],
  );

  const { request, notFound, pollError, replaceRequest, retry } =
    useRequestFlowSync({
    requestId: draft.serviceRequestId,
    currentPhase: 'found',
    routes: BATTERY_FLOW_ROUTES,
    onRequest,
    onCancelled: reset,
  });
  const [cancelBusy, setCancelBusy] = useState(false);

  const live = request ?? draft.liveRequest;
  const mechanic = assignedMechanicIdentity(live);
  const vehicleLine =
    requestVehicleLine(live) ??
    (vehicle ? `${vehicleTitle(vehicle)} · ${vehicle.year}` : null);
  const estimate =
    requestEstimateLabel(live) ??
    (option ? formatEstimatedPrice(option) : '—');

  const onCancel = () => {
    promptCancelRoadsideRequest({
      requestId: draft.serviceRequestId,
      busy: cancelBusy,
      setBusy: setCancelBusy,
      onCancelled: () => {
        reset();
        router.replace('/(app)/(tabs)');
      },
      onStatusChanged: (req) => {
        setLiveRequest(req);
      },
    });
  };

  if (notFound) {
    return (
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + spacing['2xl'] },
        ]}
      >
        <RequestMissingState
          onHome={() => router.replace('/(app)/(tabs)')}
        />
      </View>
    );
  }

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
              <CallMechanicButton phone={mechanic?.phone} />
              {customerCanCancel(live?.status ?? '') ? (
              <AnimatedPressable
                accessibilityLabel="Cancel request"
                disabled={cancelBusy}
                onPress={onCancel}
                style={styles.cancel}
              >
                <AppText variant="button" color="textSecondary">
                  {cancelBusy ? 'Cancelling…' : 'Cancel request'}
                </AppText>
              </AnimatedPressable>
              ) : null}
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
          <LiveJobMap
            customerPoint={customerPointFromLiveOrDraft(live, draft.location)}
            mechanicPoint={mechanicPointFromRequest(live)}
            waitingForMechanic={!mechanicPointFromRequest(live)}
          />
        </Reveal>

        <Reveal delayMs={timing.instant}>
          {mechanic ? (
            <MechanicCard mechanic={mechanic} variant="identity" />
          ) : (
            <AppText variant="body" color="textSecondary" style={styles.center}>
              Assigned mechanic
            </AppText>
          )}
        </Reveal>
        <PriceQuoteCard request={live} onUpdated={replaceRequest} />

        <Reveal delayMs={timing.normal}>
          <View style={styles.eta}>
            <AppText variant="caption" color="textMuted" style={styles.center}>
              Status
            </AppText>
            <AppText variant="h2" style={styles.center}>
              Mechanic found
            </AppText>
            <RequestPollHint pollError={pollError} onRetry={retry} />
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
                Estimated price
              </AppText>
              <AppText variant="bodyMedium">{estimate}</AppText>
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
