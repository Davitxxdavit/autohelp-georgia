import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { FadeIn } from '@/features/services/flow/FadeIn';
import { LiveJobMap } from '@/features/maps/LiveJobMap';
import { useServiceBottomPad } from '@/features/services/flow/ServiceScreenScaffold';
import {
  RequestMissingState,
  RequestPollHint,
} from '@/features/services/flow/RequestSyncNotice';
import {
  DIAGNOSTICS_FLOW_ROUTES,
  customerPointFromLiveOrDraft,
} from '@/features/services/flow/requestFlow';
import { useRequestFlowSync } from '@/features/services/flow/useRequestFlowSync';
import { promptCancelRoadsideRequest } from '@/features/services/flow/cancelRequest';
import { useDiagnosticsFlow } from '@/features/services/diagnostics/DiagnosticsFlowProvider';
import type { ApiServiceRequest } from '@/lib/api/types';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function StatusDot({
  delay,
  reducedMotion,
}: {
  delay: number;
  reducedMotion: boolean;
}) {
  const opacity = useSharedValue(reducedMotion ? 0.4 : 0.22);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.4;
      return;
    }
    const ease = Easing.inOut(Easing.sin);
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: timing.slow, easing: ease }),
          withTiming(0.22, { duration: timing.slow, easing: ease }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [delay, opacity, reducedMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

function StatusDots({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <View style={styles.dots} accessibilityElementsHidden>
      <StatusDot delay={0} reducedMotion={reducedMotion} />
      <StatusDot delay={timing.fast} reducedMotion={reducedMotion} />
      <StatusDot delay={timing.fast * 2} reducedMotion={reducedMotion} />
    </View>
  );
}

export default function DiagnosticsSearchingScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useServiceBottomPad();
  const router = useRouter();
  const reducedMotion = !!useReducedMotion();
  const { draft, setLiveRequest, markCompleted, reset } = useDiagnosticsFlow();

  const onRequest = useCallback(
    (req: ApiServiceRequest) => {
      setLiveRequest(req);
      if (req.status === 'COMPLETED') markCompleted(req.completed_at);
    },
    [markCompleted, setLiveRequest],
  );

  const { notFound, pollError, request, retry } = useRequestFlowSync({
    requestId: draft.serviceRequestId,
    currentPhase: 'searching',
    routes: DIAGNOSTICS_FLOW_ROUTES,
    onRequest,
    onCancelled: reset,
  });
  const [cancelBusy, setCancelBusy] = useState(false);

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
          {
            paddingTop: insets.top + spacing['2xl'],
            paddingBottom: bottomPad,
          },
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
        {
          paddingTop: insets.top + spacing['2xl'],
          paddingBottom: bottomPad,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Finding a diagnostics specialist near you."
      accessibilityState={{ busy: true }}
    >
      <FadeIn>
        <View style={styles.inner}>
          <AppText variant="label" color="primary" style={styles.center}>
            Computer diagnostics
          </AppText>
          <LiveJobMap
            customerPoint={customerPointFromLiveOrDraft(
              request ?? draft.liveRequest,
              draft.location,
            )}
          />
          <View style={styles.copy}>
            <AppText variant="h2" style={styles.center}>
              Finding a specialist
            </AppText>
            <AppText variant="body" color="textSecondary" style={styles.center}>
              Looking for an available diagnostics specialist near you
            </AppText>
            <StatusDots reducedMotion={reducedMotion} />
            <AppText variant="caption" color="textMuted" style={styles.center}>
              Usually takes less than a minute
            </AppText>
            <RequestPollHint pollError={pollError} onRetry={retry} />
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
          </View>
        </View>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  copy: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
