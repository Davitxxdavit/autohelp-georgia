import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import type { BatteryProblem } from '../types';

export function ProblemCard({
  problem,
  selected,
  onSelect,
}: {
  problem: BatteryProblem;
  selected: boolean;
  onSelect: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withTiming(selected ? 1.015 : 1, {
      duration: timing.fast,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [reducedMotion, scale, selected]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, anim]}>
      <AnimatedPressable
        accessibilityLabel={problem.title}
        accessibilityState={{ selected }}
        onPress={onSelect}
        style={[styles.card, selected && styles.selected]}
      >
        <View style={styles.emojiWrap}>
          <AppText variant="h3">{problem.emoji}</AppText>
        </View>
        <AppText variant="bodyMedium">{problem.title}</AppText>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '48%',
    flexGrow: 1,
  },
  card: {
    minHeight: 112,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  emojiWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
