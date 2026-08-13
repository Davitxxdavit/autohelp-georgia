import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import { AnimatedPressable } from './AnimatedPressable';
import { AppText } from './AppText';

export type IconButtonProps = {
  accessibilityLabel: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Prefer a vector icon node; replaceable with custom artwork later */
  icon?: ReactNode;
  label?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  accessibilityLabel,
  onPress,
  disabled,
  icon,
  label,
  size = 44,
  style,
}: IconButtonProps) {
  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {icon ?? (
        <View style={styles.fallbackDot} accessibilityElementsHidden />
      )}
      {label ? (
        <AppText variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fallbackDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  label: {
    marginTop: spacing.xxs,
  },
});
