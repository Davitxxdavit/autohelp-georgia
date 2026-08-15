import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { GradientSurface } from '@/components/ui/GradientSurface';
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

/**
 * Mock tracking canvas. Marker motion is visual only.
 * Later: map `userPoint` / `mechanicPoint` onto a MapView region.
 */
export function TrackingMap({
  userPoint = MOCK_BATUMI_LOCATION.point,
  mechanicPoint = MOCK_MECHANIC_POINT,
}: TrackingMapProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 0.42;
      return;
    }
    progress.value = withRepeat(
      withTiming(1, {
        duration: 9000,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [progress, reducedMotion]);

  const mechanicStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 18 + progress.value * 92 },
      { translateY: 86 - progress.value * 48 },
    ],
  }));

  return (
    <GradientSurface
      colors={[colors.surfaceElevated, colors.background]}
      radiusToken="xl"
      style={styles.root}
    >
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
        <View style={styles.youDot} />
        <AppText variant="caption" color="textSecondary">
          You
        </AppText>
      </View>
      <Animated.View
        style={[styles.mechanic, mechanicStyle]}
        accessibilityLabel={`Specialist. ${mechanicPoint.latitude.toFixed(4)}, ${mechanicPoint.longitude.toFixed(4)}`}
      >
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
  you: {
    position: 'absolute',
    left: 36,
    bottom: 48,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  youDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textPrimary,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  mechanic: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  mechDot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.textPrimary,
  },
});
