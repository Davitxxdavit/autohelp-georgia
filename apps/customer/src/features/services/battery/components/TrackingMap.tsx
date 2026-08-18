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

import { ServiceIcon } from '@/components/automotive/ServiceIcon';
import { AppText } from '@/components/ui/AppText';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import { MOCK_BATUMI_LOCATION, MOCK_MECHANIC_POINT } from '../mock';
import type { MockGeoPoint } from '../types';

type TrackingMapProps = {
  /** Customer pin. Replace with live user coords later. */
  userPoint?: MockGeoPoint;
  /** Specialist pin. Replace with realtime mechanic coords later. */
  mechanicPoint?: MockGeoPoint;
};

/** Slow creep along a short slice of the route — visual only, not GPS. */
const APPROACH_START = 0.28;
const APPROACH_END = 0.42;
const APPROACH_MS = 22000;

/**
 * Mock tracking canvas. Marker motion is visual only.
 * Later: map `userPoint` / `mechanicPoint` onto a MapView region.
 */
export function TrackingMap({
  userPoint = MOCK_BATUMI_LOCATION.point,
  mechanicPoint = MOCK_MECHANIC_POINT,
}: TrackingMapProps) {
  const reducedMotion = !!useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 0.36 : APPROACH_START);
  const pulse = useSharedValue(reducedMotion ? 0.22 : 0.32);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.36;
      pulse.value = 0.22;
      return;
    }

    const travelEase = Easing.inOut(Easing.quad);
    const pulseEase = Easing.inOut(Easing.sin);

    progress.value = withTiming(APPROACH_END, {
      duration: APPROACH_MS,
      easing: travelEase,
    });
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.55, {
          duration: timing.slow * 4,
          easing: pulseEase,
        }),
        withTiming(0.22, {
          duration: timing.slow * 4,
          easing: pulseEase,
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
    transform: [{ scale: 1 + pulse.value * 0.45 }],
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
          stroke={colors.primarySoft}
          strokeWidth={8}
          strokeLinecap="round"
        />
        <Path
          d="M48 168 C 90 160, 120 110, 168 96 C 210 84, 248 92, 272 64"
          fill="none"
          stroke={colors.primaryMuted}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="10 8"
        />
        <Circle cx={272} cy={64} r={5} fill={colors.primaryMuted} />
        <Circle cx={48} cy={168} r={6} fill={colors.primary} />
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
        <View style={styles.mechMark}>
          <ServiceIcon kind="mechanic" size={18} />
        </View>
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
    top: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
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
    top: -8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  mechMark: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
