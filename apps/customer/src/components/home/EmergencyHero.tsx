import { useEffect } from 'react';
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
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export type EmergencyHeroProps = {
  onPressCta?: () => void;
};

export function EmergencyHero({ onPressCta }: EmergencyHeroProps) {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  const cardOpacity = useSharedValue(0);
  const carX = useSharedValue(36);
  const carOpacity = useSharedValue(0);
  const roadX = useSharedValue(16);
  const roadOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(10);

  useEffect(() => {
    const ease = Easing.bezier(0.16, 1, 0.3, 1);

    if (reducedMotion) {
      cardOpacity.value = 1;
      carX.value = 0;
      carOpacity.value = 1;
      roadX.value = 0;
      roadOpacity.value = 1;
      ctaOpacity.value = 1;
      ctaY.value = 0;
      return;
    }

    cardOpacity.value = withTiming(1, {
      duration: timing.entrance,
      easing: ease,
    });

    carOpacity.value = withDelay(
      80,
      withTiming(1, { duration: timing.entrance, easing: ease }),
    );
    carX.value = withDelay(
      80,
      withTiming(0, { duration: timing.entrance + 80, easing: ease }),
    );

    roadOpacity.value = withDelay(
      120,
      withTiming(1, { duration: timing.normal, easing: ease }),
    );
    roadX.value = withDelay(
      120,
      withTiming(0, { duration: timing.entrance, easing: ease }),
    );

    ctaOpacity.value = withDelay(
      280,
      withTiming(1, { duration: timing.normal, easing: ease }),
    );
    ctaY.value = withDelay(
      280,
      withTiming(0, { duration: timing.normal, easing: ease }),
    );
  }, [
    cardOpacity,
    carOpacity,
    carX,
    ctaOpacity,
    ctaY,
    reducedMotion,
    roadOpacity,
    roadX,
  ]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const carStyle = useAnimatedStyle(() => ({
    opacity: carOpacity.value,
    transform: [{ translateX: carX.value }],
  }));

  const roadStyle = useAnimatedStyle(() => ({
    opacity: roadOpacity.value,
    transform: [{ translateX: roadX.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  const illustrationWidth = Math.min(width - spacing.xl * 2 - spacing.xl, 280);

  return (
    <Animated.View style={cardStyle}>
      <GradientSurface
        colors={[colors.surfaceElevated, colors.background, colors.primarySoft]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 1, y: 1 }}
        radiusToken="xl"
        style={styles.card}
      >
        <View style={styles.copy}>
          <AppText variant="label" color="primary">
            სასწრაფო დახმარება
          </AppText>
          <AppText variant="h2" style={styles.title}>
            მანქანა გაგიფუჭდა?
          </AppText>
          <AppText variant="body" color="textSecondary">
            გამოიძახე სპეციალისტი ადგილზე.
          </AppText>
        </View>

        <View style={styles.visual}>
          <Animated.View style={[styles.road, roadStyle]}>
            <RoadLines width={illustrationWidth} height={20} color={colors.border} />
          </Animated.View>
          <Animated.View style={carStyle}>
            <CarSilhouette width={illustrationWidth} height={72} />
          </Animated.View>
        </View>

        <Animated.View style={ctaStyle}>
          <AnimatedPressable
            accessibilityLabel="დახმარების გამოძახება"
            onPress={onPressCta}
            style={styles.cta}
          >
            <AppText variant="button" color="onPrimary">
              დახმარების გამოძახება
            </AppText>
          </AnimatedPressable>
        </Animated.View>
      </GradientSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    gap: spacing.lg,
    minHeight: 280,
  },
  copy: {
    gap: spacing.xs,
    maxWidth: '86%',
  },
  title: {
    marginTop: spacing.xxs,
  },
  visual: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  road: {
    width: '100%',
    alignItems: 'center',
  },
  cta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
});
