import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
import { GradientSurface } from '@/components/ui/GradientSurface';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import { MOCK_BATUMI_LOCATION, MOCK_SPECIALIST_POINT } from './location';
import type { MockGeoPoint } from './types';

type TrackingMapProps = {
  /** Customer pin. Replace with live user coords later. */
  userPoint?: MockGeoPoint;
  /** Specialist pin. Replace with realtime mechanic coords later. */
  mechanicPoint?: MockGeoPoint;
};

const APPROACH_MS = 11000;
const HOLD_MS = 700;
const RESET_MS = 1;

/**
 * Mock tracking canvas. Marker motion is visual only.
 * Later: map `userPoint` / `mechanicPoint` onto a MapView region.
 */
export function TrackingMap({
  userPoint = MOCK_BATUMI_LOCATION.point,
  mechanicPoint = MOCK_SPECIALIST_POINT,
}: TrackingMapProps) {
  const reducedMotion = !!useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 0.55 : 0);
  const pulse = useSharedValue(reducedMotion ? 0.2 : 0.35);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.55;
      pulse.value = 0.2;
      return;
    }

    const ease = Easing.inOut(Easing.quad);
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: APPROACH_MS, easing: ease }),
        withDelay(HOLD_MS, withTiming(0, { duration: RESET_MS })),
      ),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.7, {
          duration: timing.slow * 3,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0.2, {
          duration: timing.slow * 3,
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
  }, [progress, pulse, reducedMotion]);

  const mechanicStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 196 - progress.value * 154 },
      { translateY: 22 + progress.value * 128 },
    ],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 1 + pulse.value * 0.55 }],
  }));

  return (
    <GradientSurface
      colors={[colors.surfaceElevated, colors.background, colors.primarySoft]}
      radiusToken="xl"
      style={styles.root}
    >
      <View style={styles.grid} accessibilityElementsHidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLineH, { top: 18 + i * 40 }]} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLineV, { left: 24 + i * 64 }]} />
        ))}
      </View>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 320 240"
        style={StyleSheet.absoluteFill}
      >
        <Path
          d="M48 168 C 90 160, 120 110, 168 96 C 210 84, 248 92, 272 64"
          fill="none"
          stroke={colors.primaryMuted}
          strokeWidth={3}
          strokeDasharray="8 8"
        />
      </Svg>
      <View
        style={styles.you}
        accessibilityLabel={`You. ${userPoint.latitude.toFixed(4)}, ${userPoint.longitude.toFixed(4)}`}
      >
        <View style={styles.youHalo} />
        <View style={styles.youDot} />
        <AppText variant="caption" color="textSecondary">
          You
        </AppText>
      </View>
      <Animated.View
        style={[styles.mechanic, mechanicStyle]}
        accessibilityLabel={`Specialist. ${mechanicPoint.latitude.toFixed(4)}, ${mechanicPoint.longitude.toFixed(4)}`}
      >
        <Animated.View style={[styles.mechPulse, pulseStyle]} />
        <View style={styles.mechDot} />
        <AppText variant="caption" color="primary">
          Specialist
        </AppText>
      </Animated.View>
    </GradientSurface>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 260,
    overflow: 'hidden',
  },
  grid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.28,
  },
  gridLineH: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  gridLineV: {
    position: 'absolute',
    top: spacing.md,
    bottom: spacing.md,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  you: {
    position: 'absolute',
    left: 36,
    bottom: 48,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  youHalo: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  youDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textPrimary,
    borderWidth: 3,
    borderColor: colors.primary,
    zIndex: 1,
  },
  mechanic: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  mechPulse: {
    position: 'absolute',
    top: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  mechDot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.textPrimary,
    zIndex: 1,
  },
});
