import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import { AppText } from '@/components/ui/AppText';

export type ServiceIconKind =
  | 'battery'
  | 'fuel'
  | 'mechanic'
  | 'diagnostics'
  | 'tow'
  | 'locksmith';

export type ServiceIconProps = {
  kind: ServiceIconKind;
  size?: number;
  color?: string;
  accentColor?: string;
  label?: string;
  /** Swap with custom illustration asset later */
  illustration?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function Glyph({
  kind,
  size,
  color,
  accentColor,
}: {
  kind: ServiceIconKind;
  size: number;
  color: string;
  accentColor: string;
}) {
  const stroke = color;
  const accent = accentColor;

  switch (kind) {
    case 'battery':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect x={6} y={10} width={18} height={14} rx={2} fill="none" stroke={stroke} strokeWidth={1.8} />
          <Path d="M12 10 V7 H20 V10" fill="none" stroke={stroke} strokeWidth={1.8} />
          <Path d="M14 15 L17 18 L14 21" fill="none" stroke={accent} strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
      );
    case 'fuel':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Path d="M9 8 H19 V24 H9 Z" fill="none" stroke={stroke} strokeWidth={1.8} />
          <Path d="M19 12 H23 C24.5 12 25 13 25 14.5 V20" fill="none" stroke={stroke} strokeWidth={1.8} />
          <Circle cx={25} cy={22} r={2} fill={accent} />
        </Svg>
      );
    case 'mechanic':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Path
            d="M12 20 L18 14 M14 10 L10 14 L18 22 L22 18"
            fill="none"
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Circle cx={21} cy={11} r={3} fill="none" stroke={accent} strokeWidth={1.8} />
        </Svg>
      );
    case 'diagnostics':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Rect x={7} y={8} width={18} height={14} rx={2} fill="none" stroke={stroke} strokeWidth={1.8} />
          <Path d="M11 18 L14 14 L17 17 L21 12" fill="none" stroke={accent} strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
      );
    case 'tow':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Path d="M6 20 H16 L20 14 H26 V20" fill="none" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />
          <Circle cx={10} cy={22} r={2.5} fill={accent} />
          <Circle cx={23} cy={22} r={2.5} fill={accent} />
        </Svg>
      );
    case 'locksmith':
      return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
          <Circle cx={14} cy={13} r={5} fill="none" stroke={stroke} strokeWidth={1.8} />
          <Path d="M14 18 V24 H18" fill="none" stroke={accent} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
  }
}

/**
 * Lightweight service glyph. Pass `illustration` to replace with custom art later.
 */
export function ServiceIcon({
  kind,
  size = 28,
  color = colors.textPrimary,
  accentColor = colors.primary,
  label,
  illustration,
  style,
}: ServiceIconProps) {
  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="image"
      accessibilityLabel={label ?? `${kind} service icon`}
    >
      <View style={styles.glyph}>
        {illustration ?? (
          <Glyph kind={kind} size={size} color={color} accentColor={accentColor} />
        )}
      </View>
      {label ? (
        <AppText variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  glyph: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: spacing.xs,
  },
});
