import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { timing } from '@/animations/timing';
import type { JobStatus, MockGeoPoint } from '@/features/jobs/types';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

/** Visual-only slice of the mock route. Does not change ETA or distance. */
const APPROACH_START = 0.26;
const APPROACH_END = 0.46;
const APPROACH_MS = 22000;

type MechanicTrackingMapProps = {
  mechanicPoint: MockGeoPoint;
  customerPoint: MockGeoPoint;
  status: JobStatus;
};

function isEnRoute(status: JobStatus): boolean {
  return status === 'ON_THE_WAY';
}

function isArrived(status: JobStatus): boolean {
  return status === 'ARRIVED' || status === 'IN_PROGRESS';
}

/**
 * Schematic tracking canvas. Swap this component for Google Maps later;
 * keep the same props (mechanic/customer points + job status).
 */
export function MechanicTrackingMap({
  mechanicPoint,
  customerPoint,
  status,
}: MechanicTrackingMapProps) {
  const reducedMotion = !!useReducedMotion();
  const progress = useSharedValue(
    reducedMotion
      ? isArrived(status)
        ? APPROACH_END
        : APPROACH_START
      : APPROACH_START,
  );
  const pulse = useSharedValue(reducedMotion ? 0.18 : 0.22);

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(progress);
      cancelAnimation(pulse);
      progress.value = isArrived(status) ? APPROACH_END : APPROACH_START;
      pulse.value = 0.18;
      return;
    }

    if (isEnRoute(status)) {
      progress.value = APPROACH_START;
      progress.value = withTiming(APPROACH_END, {
        duration: APPROACH_MS,
        easing: Easing.inOut(Easing.quad),
      });
      pulse.value = withRepeat(
        withSequence(
          withTiming(0.36, {
            duration: timing.slow * 5,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0.18, {
            duration: timing.slow * 5,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      );
      return () => {
        cancelAnimation(progress);
        cancelAnimation(pulse);
      };
    }

    cancelAnimation(progress);
    cancelAnimation(pulse);
    if (isArrived(status)) {
      if (progress.value <= APPROACH_START + 0.01) {
        progress.value = APPROACH_END;
      }
    } else {
      progress.value = APPROACH_START;
    }
    pulse.value = 0.16;
    return undefined;
  }, [progress, pulse, reducedMotion, status]);

  const quiet = isArrived(status);
  const showPulse = isEnRoute(status) && !reducedMotion;

  const mechanicStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 28 + progress.value * 224 },
      { translateY: 132 + progress.value * -112 },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: showPulse ? pulse.value : 0,
    transform: [{ scale: 1 + pulse.value * 0.35 }],
  }));

  return (
    <View
      style={styles.root}
      accessibilityLabel={`Mock map. Mechanic ${mechanicPoint.latitude.toFixed(4)}, ${mechanicPoint.longitude.toFixed(4)}. Customer ${customerPoint.latitude.toFixed(4)}, ${customerPoint.longitude.toFixed(4)}.`}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 320 200"
        style={StyleSheet.absoluteFill}
      >
        <Path
          d="M48 160 C 108 154, 148 112, 188 88 C 228 64, 256 52, 276 44"
          fill="none"
          stroke={quiet ? colors.border : colors.primaryMuted}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="9 8"
          opacity={quiet ? 0.55 : 0.9}
        />
        <Circle cx={276} cy={44} r={5} fill={colors.textPrimary} />
        <Circle cx={48} cy={160} r={4} fill={colors.primaryMuted} />
      </Svg>

      <View style={styles.customer} accessibilityLabel="Customer">
        <View style={styles.customerDot} />
        <AppText variant="caption" color="textSecondary">
          Customer
        </AppText>
      </View>

      <Animated.View
        style={[styles.mechanic, mechanicStyle]}
        accessibilityLabel="You"
      >
        <Animated.View style={[styles.mechPulse, pulseStyle]} />
        <View style={styles.mechMark} />
        <AppText variant="caption" color="primary">
          You
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  customer: {
    position: 'absolute',
    right: 28,
    top: 22,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  customerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textPrimary,
    borderWidth: 3,
    borderColor: colors.border,
  },
  mechanic: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 56,
    marginLeft: -28,
    marginTop: -18,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  mechPulse: {
    position: 'absolute',
    top: -6,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
  },
  mechMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.onPrimary,
    zIndex: 1,
  },
});
