import { useEffect, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { RoadLines } from '@/components/automotive/RoadLines';
import { AppText } from '@/components/ui/AppText';
import { clampLaunchDuration } from '@/animations/transitions';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type AutoHelpLaunchVisualProps = {
  duration?: number;
  onComplete?: () => void;
  reducedMotion?: boolean;
  fullscreen?: boolean;
};

/**
 * Launch visual — starts on mount, always invokes onComplete once.
 */
export function AutoHelpLaunchVisual({
  duration,
  onComplete,
  reducedMotion: reducedMotionProp,
  fullscreen = false,
}: AutoHelpLaunchVisualProps) {
  const { width } = useWindowDimensions();
  const systemReduced = useReducedMotion();
  const reducedMotion = reducedMotionProp ?? !!systemReduced;
  const totalMs = clampLaunchDuration(duration);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completedRef = useRef(false);

  const backdrop = useSharedValue(0);
  const carX = useSharedValue(Math.min(width * 0.42, 160));
  const carOpacity = useSharedValue(0);
  const accentOpacity = useSharedValue(0);
  const brandOpacity = useSharedValue(0);
  const brandY = useSharedValue(12);
  const roadOpacity = useSharedValue(0);
  const roadX = useSharedValue(24);

  useEffect(() => {
    completedRef.current = false;

    const finish = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current?.();
    };

    let handle: ReturnType<typeof setTimeout> | undefined;

    if (reducedMotion) {
      backdrop.value = 1;
      carX.value = 0;
      carOpacity.value = 1;
      accentOpacity.value = 1;
      brandOpacity.value = 1;
      brandY.value = 0;
      roadOpacity.value = 1;
      roadX.value = 0;
      handle = setTimeout(finish, 320);
      return () => {
        if (handle) clearTimeout(handle);
      };
    }

    const ease = Easing.bezier(0.16, 1, 0.3, 1);

    backdrop.value = withTiming(1, { duration: 120, easing: ease });
    carOpacity.value = withDelay(
      150,
      withTiming(1, { duration: 520, easing: ease }),
    );
    carX.value = withDelay(
      200,
      withTiming(0, { duration: 900, easing: ease }),
    );
    roadOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 420, easing: ease }),
    );
    roadX.value = withDelay(
      500,
      withTiming(0, { duration: 700, easing: ease }),
    );
    accentOpacity.value = withDelay(
      700,
      withTiming(1, { duration: 360, easing: ease }),
    );
    brandOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 420, easing: ease }),
    );
    brandY.value = withDelay(
      900,
      withTiming(0, { duration: 420, easing: ease }),
    );

    handle = setTimeout(finish, totalMs);
    // Hard safety if anything interrupts the primary timer
    const safety = setTimeout(finish, totalMs + 800);

    return () => {
      if (handle) clearTimeout(handle);
      clearTimeout(safety);
    };
    // Intentionally exclude shared-value identities — they are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, totalMs, width]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const carStyle = useAnimatedStyle(() => ({
    opacity: carOpacity.value,
    transform: [{ translateX: carX.value }],
  }));

  const roadStyle = useAnimatedStyle(() => ({
    opacity: roadOpacity.value,
    transform: [{ translateX: roadX.value }],
  }));

  const accentStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity.value,
  }));

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandY.value }],
  }));

  return (
    <View
      style={[styles.root, fullscreen && styles.fullscreen]}
      accessibilityLabel="AutoHelp launch animation"
      pointerEvents="none"
    >
      <Animated.View style={[styles.backdrop, backdropStyle]} />
      <Animated.View style={[styles.glow, accentStyle]} />
      <Animated.View style={[styles.road, roadStyle]}>
        <RoadLines width={Math.min(width - spacing['2xl'], 320)} />
      </Animated.View>
      <Animated.View style={[styles.car, carStyle]}>
        <CarSilhouette width={Math.min(width * 0.72, 280)} />
      </Animated.View>
      <Animated.View style={[styles.accents, accentStyle]}>
        <View style={styles.tick} />
        <View style={[styles.tick, styles.tickMid]} />
        <View style={styles.tick} />
      </Animated.View>
      <Animated.View style={[styles.brand, brandStyle]}>
        <AppText variant="label" color="primary">
          AutoHelp
        </AppText>
        <AppText variant="h2" style={styles.brandTitle}>
          Assistance, on demand
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  fullscreen: {
    flex: 1,
    minHeight: 0,
    borderRadius: 0,
    borderWidth: 0,
    width: '100%',
    height: '100%',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
  },
  glow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primarySoft,
    top: '28%',
  },
  road: {
    position: 'absolute',
    bottom: '22%',
  },
  car: {
    marginBottom: spacing.xl,
  },
  accents: {
    position: 'absolute',
    top: spacing['3xl'],
    right: spacing.xl,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tick: {
    width: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  tickMid: {
    width: 18,
    opacity: 1,
  },
  brand: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  brandTitle: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
