import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import { AppText } from './AppText';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'primary';

export type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
  /** Visible text + accessibility — do not rely on color alone */
  style?: StyleProp<ViewStyle>;
};

const toneStyles: Record<
  StatusTone,
  { bg: string; fg: keyof typeof colors; dot: string }
> = {
  neutral: {
    bg: colors.surfaceElevated,
    fg: 'textSecondary',
    dot: colors.textMuted,
  },
  success: {
    bg: colors.successSoft,
    fg: 'success',
    dot: colors.success,
  },
  warning: {
    bg: colors.warningSoft,
    fg: 'warning',
    dot: colors.warning,
  },
  danger: {
    bg: colors.dangerSoft,
    fg: 'danger',
    dot: colors.danger,
  },
  primary: {
    bg: colors.primarySoft,
    fg: 'primary',
    dot: colors.primary,
  },
};

export function StatusBadge({
  label,
  tone = 'neutral',
  style,
}: StatusBadgeProps) {
  const palette = toneStyles[tone];

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
      style={[styles.base, { backgroundColor: palette.bg }, style]}
    >
      <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      <AppText variant="caption" color={palette.fg} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  label: {
    fontWeight: '600',
  },
});
