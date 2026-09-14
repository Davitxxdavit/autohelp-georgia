import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { MechanicCard } from '@/features/services/flow/MechanicCard';
import { Reveal } from '@/features/services/flow/Reveal';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import {
  RequestMissingState,
  RequestPollHint,
} from '@/features/services/flow/RequestSyncNotice';
import { PriceQuoteCard } from '@/features/services/flow/PriceQuoteCard';
import { CallMechanicButton } from '@/features/services/flow/CallMechanicButton';
import { LiveJobMap } from '@/features/maps/LiveJobMap';
import { mechanicPointFromRequest } from '@/features/services/flow/TripLivePanel';
import { promptCancelRoadsideRequest } from '@/features/services/flow/cancelRequest';
import {
  DIAGNOSTICS_FLOW_ROUTES,
  assignedMechanicIdentity,
  customerPointFromLiveOrDraft,
  requestEstimateLabel,
  requestVehicleLine,
} from '@/features/services/flow/requestFlow';
import { useRequestFlowSync } from '@/features/services/flow/useRequestFlowSync';
import { customerCanCancel } from '@/lib/api/status';
import { useDiagnosticsFlow } from '@/features/services/diagnostics/DiagnosticsFlowProvider';
import {
  formatEstimatedPrice,
  getDiagnosticsOption,
} from '@/features/services/diagnostics/mock';
import { vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import type { ApiServiceRequest } from '@/lib/api/types';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function DiagnosticsFoundScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, reset, setLiveRequest, markCompleted } = useDiagnosticsFlow();
  const { getById } = useVehicles();
  const option = draft.optionId
    ? getDiagnosticsOption(draft.optionId)
    : undefined;
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
    routes: DIAGNOSTICS_FLOW_ROUTES,
    onRequest,
    onCancelled: reset,
  });
  const [cancelBusy, setCancelBusy] = useState(false);

  const live = request ?? draft.liveRequest;
  const specialist = assignedMechanicIdentity(live);
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
        router.replace('/(app)/(tabs)' as Href);
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
          onHome={() => router.replace('/(app)/(tabs)' as Href)}
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
      <ServiceScreenScaffold
        contentContainerStyle={styles.content}
        footer={
          <Reveal delayMs={timing.slow}>
            <View style={styles.footerInner}>
              <PrimaryButton
                label="Track specialist"
                onPress={() => router.replace('/diagnostics/tracking' as Href)}
              />
              <CallMechanicButton phone={specialist?.phone} />
              {customerCanCancel(live?.status ?? '') ? (
              <AnimatedPressable
                accessibilityLabel="Cancel request"
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
            Specialist found
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
          {specialist ? (
            <MechanicCard mechanic={specialist} variant="identity" />
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
              Specialist found
            </AppText>
            <RequestPollHint pollError={pollError} onRetry={retry} />
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
