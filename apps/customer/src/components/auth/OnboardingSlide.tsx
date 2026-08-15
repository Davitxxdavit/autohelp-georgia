import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { RoadLines } from '@/components/automotive/RoadLines';
import { ServiceIcon } from '@/components/automotive/ServiceIcon';
import { AppText } from '@/components/ui/AppText';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type OnboardingSlideData = {
  id: string;
  title: string;
  description: string;
  caption?: string;
};

export type OnboardingSlideProps = {
  slide: OnboardingSlideData;
  index: number;
  active: boolean;
};

function SlideVisual({
  index,
  caption,
}: {
  index: number;
  caption?: string;
}) {
  if (index === 0) {
    return (
      <View style={styles.visualInner}>
        <RoadLines width={240} height={18} />
        <CarSilhouette width={240} height={78} />
      </View>
    );
  }

  if (index === 1) {
    return (
      <View style={styles.services}>
        <ServiceIcon kind="mechanic" />
        <ServiceIcon kind="diagnostics" />
        <ServiceIcon kind="tow" />
        <ServiceIcon kind="battery" />
      </View>
    );
  }

  return (
    <View style={styles.visualInner}>
      <CarSilhouette width={220} height={72} color={colors.textSecondary} />
      <View style={styles.trackBar}>
        <View style={styles.trackFill} />
      </View>
      {caption ? (
        <AppText variant="caption" color="textMuted">
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}

export function OnboardingSlide({ slide, index, active }: OnboardingSlideProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateX = useSharedValue(reducedMotion ? 0 : 28);
  const artX = useSharedValue(reducedMotion ? 0 : 18);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      translateX.value = 0;
      artX.value = 0;
      return;
    }

    if (!active) {
      opacity.value = 1;
      translateX.value = 0;
      artX.value = 0;
      return;
    }

    const ease = Easing.bezier(0.16, 1, 0.3, 1);
    opacity.value = 0;
    translateX.value = 28;
    artX.value = 18;

    opacity.value = withTiming(1, { duration: timing.entrance, easing: ease });
    translateX.value = withTiming(0, {
      duration: timing.entrance,
      easing: ease,
    });
    artX.value = withTiming(0, {
      duration: timing.entrance + 80,
      easing: ease,
    });
  }, [active, artX, index, opacity, reducedMotion, slide.id, translateX]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const artStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: artX.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={artStyle}>
        <GradientSurface
          colors={[colors.surfaceElevated, colors.background]}
          radiusToken="xl"
          style={styles.art}
        >
          <SlideVisual index={index} caption={slide.caption} />
        </GradientSurface>
      </Animated.View>

      <Animated.View style={[styles.copy, contentStyle]}>
        <AppText variant="h2">{slide.title}</AppText>
        <AppText variant="body" color="textSecondary">
          {slide.description}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: spacing.xl,
    justifyContent: 'center',
    paddingBottom: spacing.lg,
  },
  art: {
    minHeight: 200,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualInner: {
    alignItems: 'center',
    gap: spacing.md,
  },
  services: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  trackBar: {
    width: 180,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  trackFill: {
    width: '62%',
    height: '100%',
    backgroundColor: colors.primary,
  },
  copy: {
    gap: spacing.sm,
  },
});
