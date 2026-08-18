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

export function ServiceOptionCard({
  title,
  subtitle,
  priceLabel,
  selected,
  onSelect,
}: {
  title: string;
  subtitle: string;
  priceLabel?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      return;
    }
    scale.value = withTiming(selected ? 1.01 : 1, {
      duration: timing.fast,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [reducedMotion, scale, selected]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={anim}>
      <AnimatedPressable
        accessibilityLabel={
          priceLabel ? `${title}. ${priceLabel}` : title
        }
        accessibilityState={{ selected }}
        onPress={onSelect}
        style={[styles.card, selected && styles.selected]}
      >
        <View style={styles.copy}>
          <AppText variant="bodyMedium">{title}</AppText>
          <AppText variant="caption" color="textSecondary">
            {subtitle}
          </AppText>
        </View>
        {priceLabel ? (
          <View style={styles.price}>
            <AppText variant="caption" color="textMuted">
              Estimated
            </AppText>
            <AppText variant="bodyMedium" color="primary">
              {priceLabel}
            </AppText>
          </View>
        ) : null}
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  price: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
