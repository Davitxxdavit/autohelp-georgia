import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, Path, type SvgProps } from 'react-native-svg';

import { colors } from '@/theme/colors';

export type CarSilhouetteProps = {
  width?: number;
  height?: number;
  color?: string;
  accentColor?: string;
  /**
   * Swap in a custom illustration later without rewriting call sites.
   * When provided, replaces the default vector silhouette.
   */
  illustration?: ReactNode;
  accessibilityLabel?: string;
} & Omit<SvgProps, 'width' | 'height' | 'children'>;

/**
 * Clean premium car outline — placeholder for future custom artwork.
 */
export function CarSilhouette({
  width = 220,
  height = 88,
  color = colors.textPrimary,
  accentColor = colors.primary,
  illustration,
  accessibilityLabel = 'Vehicle silhouette',
  ...svgProps
}: CarSilhouetteProps) {
  if (illustration) {
    return <>{illustration}</>;
  }

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 220 88"
      accessibilityLabel={accessibilityLabel}
      {...svgProps}
    >
      {/* Body */}
      <Path
        d="M18 58 C22 42 34 30 52 26 L78 18 C96 12 128 10 152 16 L178 26 C192 32 202 42 206 54 L208 58 C208 64 204 68 198 68 L24 68 C18 68 16 64 18 58 Z"
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Cabin / glass */}
      <Path
        d="M72 28 L96 18 C112 14 132 14 148 20 L168 28 L160 46 L80 46 Z"
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        opacity={0.85}
      />
      {/* Accent stripe */}
      <Path
        d="M40 52 H188"
        stroke={accentColor}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.9}
      />
      {/* Wheels */}
      <Circle cx={58} cy={68} r={12} fill="none" stroke={color} strokeWidth={2.2} />
      <Circle cx={58} cy={68} r={4.5} fill={accentColor} opacity={0.85} />
      <Circle cx={164} cy={68} r={12} fill="none" stroke={color} strokeWidth={2.2} />
      <Circle cx={164} cy={68} r={4.5} fill={accentColor} opacity={0.85} />
      {/* Headlight hint */}
      <Ellipse cx={204} cy={52} rx={4} ry={2.5} fill={accentColor} opacity={0.75} />
    </Svg>
  );
}
