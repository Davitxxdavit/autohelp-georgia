import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
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

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { RoadLines } from '@/components/automotive/RoadLines';
import { ServiceIcon } from '@/components/automotive/ServiceIcon';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { runSubtlePulse } from '@/animations/transitions';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const RING_MS = timing.slow * 5;
const RING_STAGGER = timing.slow;
const BREATH_MS = timing.slow * 3;
const ROAD_MS = timing.slow * 8;

function PulseRing({
  delay,
  reducedMotion,
}: {
  delay: number;
  reducedMotion: boolean;
}) {
  const scale = useSharedValue(0.68);
  const opacity = useSharedValue(0.42);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = 0.18;
      return;
    }
    const ease = Easing.out(Easing.quad);
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(1.42, { duration: RING_MS, easing: ease }), -1, false),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0, { duration: RING_MS, easing: ease }), -1, false),
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [delay, opacity, reducedMotion, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.ring, style]} />;
}

export function SearchingVisual() {
  const reducedMotion = !!useReducedMotion();
  const glow = useSharedValue(reducedMotion ? 0.5 : 0.35);
  const coreScale = useSharedValue(1);
  const sceneY = useSharedValue(0);
  const roadX = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      glow.value = 0.5;
      coreScale.value = 1;
      sceneY.value = 0;
      roadX.value = 0;
      return;
    }

    const ease = Easing.inOut(Easing.sin);
    glow.value = withRepeat(
      withSequence(
        withTiming(0.72, { duration: BREATH_MS, easing: ease }),
        withTiming(0.32, { duration: BREATH_MS, easing: ease }),
      ),
      -1,
      false,
    );
    runSubtlePulse(coreScale, false);
    sceneY.value = withRepeat(
      withTiming(-4, { duration: BREATH_MS, easing: ease }),
      -1,
      true,
    );
    roadX.value = withRepeat(
      withTiming(10, { duration: ROAD_MS, easing: ease }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(glow);
      cancelAnimation(coreScale);
      cancelAnimation(sceneY);
      cancelAnimation(roadX);
    };
  }, [coreScale, glow, reducedMotion, roadX, sceneY]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }],
  }));

  const sceneStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sceneY.value }],
  }));

  const roadStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: roadX.value }],
  }));

  return (
    <GradientSurface
      colors={[colors.surfaceElevated, colors.background, colors.primarySoft]}
      radiusToken="xl"
      style={styles.root}
    >
      <Animated.View style={[styles.glow, glowStyle]} />
      <PulseRing delay={0} reducedMotion={reducedMotion} />
      <PulseRing delay={RING_STAGGER} reducedMotion={reducedMotion} />
      <PulseRing delay={RING_STAGGER * 2} reducedMotion={reducedMotion} />
      <Animated.View style={[styles.core, coreStyle]}>
        <ServiceIcon kind="mechanic" size={28} />
      </Animated.View>
      <Animated.View style={[styles.scene, sceneStyle]}>
        <Animated.View style={roadStyle}>
          <RoadLines width={220} height={16} color={colors.border} />
        </Animated.View>
        <CarSilhouette width={188} height={58} color={colors.textSecondary} />
      </Animated.View>
    </GradientSurface>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: colors.primarySoft,
  },
  ring: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1.5,
    borderColor: colors.primary,
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
  scene: {
    position: 'absolute',
    bottom: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
});
