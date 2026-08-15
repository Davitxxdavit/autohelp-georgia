import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { timing } from '@/animations/timing';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export type OptionSelectCardProps = {
  label: string;
  selected?: boolean;
  index?: number;
  onPress: () => void;
};

/** Full-width selectable option card for the request wizard */
export function OptionSelectCard({
  label,
  selected,
  index = 0,
  onPress,
}: OptionSelectCardProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 12);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const ease = Easing.bezier(0.16, 1, 0.3, 1);
    opacity.value = withDelay(
      index * 60,
      withTiming(1, { duration: timing.normal, easing: ease }),
    );
    translateY.value = withDelay(
      index * 60,
      withTiming(0, { duration: timing.normal, easing: ease }),
    );
  }, [index, opacity, reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <AnimatedPressable
        accessibilityLabel={label}
        accessibilityState={{ selected: !!selected }}
        onPress={onPress}
        style={[styles.card, selected && styles.cardSelected]}
      >
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioDot} /> : null}
        </View>
        <AppText
          variant="bodyMedium"
          color={selected ? 'primary' : 'textPrimary'}
          style={styles.label}
        >
          {label}
        </AppText>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  label: {
    flex: 1,
  },
});
