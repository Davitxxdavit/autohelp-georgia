import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, type RadiusToken } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export type GradientSurfaceProps = {
  children?: ReactNode;
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  radiusToken?: RadiusToken;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

const defaultGradient = [colors.surfaceElevated, colors.background] as const;

/**
 * Layered surface with a subtle gradient wash.
 * Swap `colors` later for brand illustration overlays without rewriting callers.
 */
export function GradientSurface({
  children,
  colors: gradientColors = defaultGradient,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  radiusToken = 'lg',
  padded = false,
  style,
}: GradientSurfaceProps) {
  return (
    <LinearGradient
      colors={[...gradientColors]}
      start={start}
      end={end}
      style={[
        styles.base,
        {
          borderRadius: radius[radiusToken],
          padding: padded ? spacing.lg : undefined,
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
