import { type ReactNode, useCallback, useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { MechanicCard } from '@/features/services/battery/components/MechanicCard';
import { TrackingMap } from '@/features/services/battery/components/TrackingMap';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { MOCK_MECHANIC_POINT } from '@/features/services/battery/mock';
import {
  RequestMissingState,
  RequestPollHint,
} from '@/features/services/flow/RequestSyncNotice';
import {
  BATTERY_FLOW_ROUTES,
  assignedMechanicIdentity,
  trackingStatusCopy,
} from '@/features/services/flow/requestFlow';
import { useRequestFlowSync } from '@/features/services/flow/useRequestFlowSync';
import { requestStatusTone } from '@/lib/api/status';
import type { ApiServiceRequest } from '@/lib/api/types';
import { runPreset } from '@/animations/transitions';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
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

export default function BatteryTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, setLiveRequest, markCompleted } = useBatteryFlow();

  const onRequest = useCallback(
    (req: ApiServiceRequest) => {
      setLiveRequest(req);
      if (req.status === 'COMPLETED') markCompleted(req.completed_at);
    },
    [markCompleted, setLiveRequest],
  );

  const { request, notFound, pollError } = useRequestFlowSync({
    requestId: draft.serviceRequestId,
    currentPhase: 'tracking',
    routes: BATTERY_FLOW_ROUTES,
    onRequest,
  });

  const live = request ?? draft.liveRequest;
  const status = live?.status ?? 'ON_THE_WAY';
  const mechanic = assignedMechanicIdentity(live);
  const statusCopy = trackingStatusCopy(status, 'battery');

  const onContact = () => {
    Alert.alert(
      'Contact specialist',
      'Calling will be available in a later build.',
    );
  };

  if (notFound) {
    return (
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + spacing.lg },
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
        { paddingTop: insets.top + spacing.lg },
      ]}
    >
      <BatteryScreenScaffold
        contentContainerStyle={styles.content}
      >
        <Reveal delayMs={0}>
          <View style={styles.heading}>
            <AppText variant="label" color="primary">
              Battery Assistance
            </AppText>
            <StatusBadge
              label={statusCopy.title}
              tone={requestStatusTone(status)}
            />
          </View>
        </Reveal>

        <Reveal delayMs={timing.instant}>
          <View style={styles.eta}>
            <AppText variant="caption" color="textMuted" style={styles.center}>
              {statusCopy.caption}
            </AppText>
            <AppText variant="h2" style={styles.center}>
              {statusCopy.title}
            </AppText>
            <RequestPollHint pollError={pollError} />
          </View>
        </Reveal>

        <Reveal delayMs={timing.normal}>
          <TrackingMap
            userPoint={draft.location.point}
            mechanicPoint={MOCK_MECHANIC_POINT}
          />
        </Reveal>

        <Reveal delayMs={timing.slow}>
          <View style={styles.specialist}>
            {mechanic ? (
              <MechanicCard mechanic={mechanic} />
            ) : null}
            <AnimatedPressable
              accessibilityLabel="Contact specialist"
              onPress={onContact}
              style={styles.contact}
            >
              <AppText variant="button" color="primary">
                Contact specialist
              </AppText>
            </AnimatedPressable>
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
    gap: spacing.md,
    flexGrow: 0,
  },
  heading: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  eta: {
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
  specialist: {
    gap: spacing.sm,
  },
  contact: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
