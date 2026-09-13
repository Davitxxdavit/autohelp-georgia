import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { MechanicCard } from '@/features/services/flow/MechanicCard';
import { Reveal } from '@/features/services/flow/Reveal';
import { CallMechanicButton } from '@/features/services/flow/CallMechanicButton';
import { PriceQuoteCard } from '@/features/services/flow/PriceQuoteCard';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import {
  RequestMissingState,
  RequestPollHint,
} from '@/features/services/flow/RequestSyncNotice';
import {
  KEYS_FLOW_ROUTES,
  assignedMechanicIdentity,
  customerPointFromLiveOrDraft,
  trackingStatusCopy,
} from '@/features/services/flow/requestFlow';
import { TripLivePanel } from '@/features/services/flow/TripLivePanel';
import { useRequestFlowSync } from '@/features/services/flow/useRequestFlowSync';
import { useKeysFlow } from '@/features/services/keys/KeysFlowProvider';
import type { ApiServiceRequest } from '@/lib/api/types';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function KeysTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, setLiveRequest, markCompleted, reset } = useKeysFlow();

  const onRequest = useCallback(
    (req: ApiServiceRequest) => {
      setLiveRequest(req);
      if (req.status === 'COMPLETED') markCompleted(req.completed_at);
    },
    [markCompleted, setLiveRequest],
  );

  const { request, notFound, pollError, replaceRequest } = useRequestFlowSync({
    requestId: draft.serviceRequestId,
    currentPhase: 'tracking',
    routes: KEYS_FLOW_ROUTES,
    onRequest,
    onCancelled: reset,
  });

  const live = request ?? draft.liveRequest;
  const status = live?.status ?? 'ON_THE_WAY';
  const specialist = assignedMechanicIdentity(live);
  const statusCopy = trackingStatusCopy(status, 'keys');

  if (notFound) {
    return (
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + spacing.lg },
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
        { paddingTop: insets.top + spacing.lg },
      ]}
    >
      <ServiceScreenScaffold contentContainerStyle={styles.content}>
        <Reveal delayMs={0}>
          <View style={styles.heading}>
            <AppText variant="label" color="primary">
              Live tracking
            </AppText>
            <AppText variant="h3">{statusCopy.title}</AppText>
          </View>
        </Reveal>

        <Reveal delayMs={timing.instant}>
          <TripLivePanel
            request={live}
            customerPoint={customerPointFromLiveOrDraft(live, draft.location)}
            kind="keys"
          />
          <RequestPollHint pollError={pollError} />
        </Reveal>

        <Reveal delayMs={timing.slow}>
          {specialist ? <MechanicCard mechanic={specialist} /> : null}
          <CallMechanicButton phone={specialist?.phone} />
        </Reveal>
        <PriceQuoteCard request={live} onUpdated={replaceRequest} />
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
    gap: spacing.md,
    flexGrow: 0,
  },
  heading: {
    gap: spacing.xxs,
  },
  eta: {
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
});
