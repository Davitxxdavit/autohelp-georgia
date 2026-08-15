import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
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
import { spacing } from '@/theme/spacing';

export function BatteryHero() {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.45);

  useEffect(() => {
    if (reducedMotion) {
      pulse.value = 1;
      glow.value = 0.6;
      return;
    }
    const ease = Easing.inOut(Easing.sin);
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: timing.slow * 2, easing: ease }),
        withTiming(1, { duration: timing.slow * 2, easing: ease }),
      ),
      -1,
      false,
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: timing.slow * 2, easing: ease }),
        withTiming(0.4, { duration: timing.slow * 2, easing: ease }),
      ),
      -1,
      false,
    );
  }, [glow, pulse, reducedMotion]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <GradientSurface
      colors={[colors.surfaceElevated, colors.background, colors.primarySoft]}
      radiusToken="xl"
      style={styles.root}
    >
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={iconStyle}>
        <ServiceIcon kind="battery" size={48} />
      </Animated.View>
      <View style={styles.copy}>
        <AppText variant="label" color="primary">
          Battery Assistance
        </AppText>
        <AppText variant="body" color="textSecondary">
          Get help with a dead or failing battery.
        </AppText>
      </View>
    </GradientSurface>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 168,
    padding: spacing.xl,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    gap: spacing.md,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primarySoft,
    top: -36,
    right: -20,
  },
  copy: {
    gap: spacing.xxs,
    maxWidth: '88%',
  },
});
