import { useCallback } from 'react';
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
import {
  RequestMissingState,
  RequestPollHint,
} from '@/features/services/flow/RequestSyncNotice';
import {
  KEYS_FLOW_ROUTES,
  assignedMechanicIdentity,
  requestEstimateLabel,
  requestVehicleLine,
} from '@/features/services/flow/requestFlow';
import { useRequestFlowSync } from '@/features/services/flow/useRequestFlowSync';
import { useKeysFlow } from '@/features/services/keys/KeysFlowProvider';
import {
  getKeysProblem,
  PRICE_CONFIRM_LATER,
} from '@/features/services/keys/mock';
import { vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import type { ApiServiceRequest } from '@/lib/api/types';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function KeysFoundScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, reset, setLiveRequest, markCompleted } = useKeysFlow();
  const { getById } = useVehicles();
  const problem = draft.problemId ? getKeysProblem(draft.problemId) : undefined;
  const vehicle = draft.vehicleId ? getById(draft.vehicleId) : undefined;

  const onRequest = useCallback(
    (req: ApiServiceRequest) => {
      setLiveRequest(req);
      if (req.status === 'COMPLETED') markCompleted(req.completed_at);
    },
    [markCompleted, setLiveRequest],
  );

  const { request, notFound, pollError } = useRequestFlowSync({
    requestId: draft.serviceRequestId,
    currentPhase: 'found',
    routes: KEYS_FLOW_ROUTES,
    onRequest,
    onCancelled: reset,
  });

  const live = request ?? draft.liveRequest;
  const specialist = assignedMechanicIdentity(live);
  const vehicleLine =
    requestVehicleLine(live) ??
    (vehicle ? `${vehicleTitle(vehicle)} · ${vehicle.year}` : null);
  const estimate = requestEstimateLabel(live) ?? PRICE_CONFIRM_LATER;

  const onCancel = () => {
    Alert.alert(
      'Leave request?',
      'You can still find this request in Orders.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            reset();
            router.replace('/(app)/(tabs)');
          },
        },
      ],
    );
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
                onPress={() => router.replace('/keys/tracking' as Href)}
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
            Locksmith found
          </AppText>
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

        <Reveal delayMs={timing.normal}>
          <View style={styles.eta}>
            <AppText variant="caption" color="textMuted" style={styles.center}>
              Status
            </AppText>
            <AppText variant="h2" style={styles.center}>
              Locksmith found
            </AppText>
            <RequestPollHint pollError={pollError} />
          </View>
        </Reveal>

        <Reveal delayMs={timing.slow}>
          <View style={styles.details}>
            <Divider />
            <AppText variant="bodyMedium">Auto Key</AppText>
            {problem ? (
              <AppText variant="caption" color="textSecondary">
                {problem.title}
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
                Price
              </AppText>
              <AppText variant="bodyMedium">{estimate}</AppText>
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
