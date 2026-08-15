import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { ServiceIcon } from '@/components/automotive/ServiceIcon';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function PulseRing({
  delay,
  reducedMotion,
}: {
  delay: number;
  reducedMotion: boolean;
}) {
  const scale = useSharedValue(0.55);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = 0.2;
      return;
    }
    const ease = Easing.out(Easing.quad);
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(1.55, { duration: 1800, easing: ease }), -1, false),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0, { duration: 1800, easing: ease }), -1, false),
    );
  }, [delay, opacity, reducedMotion, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.ring, style]} />;
}

export function SearchingVisual() {
  const reducedMotion = !!useReducedMotion();
  const carY = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    carY.value = withRepeat(
      withTiming(-8, {
        duration: timing.slow * 2,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    spin.value = withRepeat(
      withTiming(360, {
        duration: 4200,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [carY, reducedMotion, spin]);

  const carStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: carY.value }],
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  return (
    <View style={styles.root}>
      <View style={styles.grid} accessibilityElementsHidden>
        {Array.from({ length: 5 }).map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {Array.from({ length: 5 }).map((__, col) => (
              <View key={col} style={styles.cell} />
            ))}
          </View>
        ))}
      </View>
      <PulseRing delay={0} reducedMotion={reducedMotion} />
      <PulseRing delay={420} reducedMotion={reducedMotion} />
      <PulseRing delay={840} reducedMotion={reducedMotion} />
      <Animated.View style={[styles.spinner, spinStyle]} />
      <View style={styles.core}>
        <ServiceIcon kind="mechanic" size={28} />
      </View>
      <Animated.View style={[styles.car, carStyle]}>
        <CarSilhouette width={180} height={56} color={colors.textSecondary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  grid: {
    ...StyleSheet.absoluteFill,
    padding: spacing.lg,
    gap: spacing.md,
    opacity: 0.35,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  cell: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  spinner: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: colors.primaryMuted,
    borderTopColor: colors.primary,
    zIndex: 1,
  },
  core: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  car: {
    position: 'absolute',
    bottom: spacing.md,
  },
});
