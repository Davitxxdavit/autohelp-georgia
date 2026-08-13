import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { colors } from '@/theme/colors';

export type RoadLinesProps = {
  width?: number;
  height?: number;
  color?: string;
  dashed?: boolean;
  /** Replaceable illustration slot for future custom road/motion art */
  illustration?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function RoadLines({
  width = 280,
  height = 24,
  color = colors.border,
  dashed = true,
  illustration,
  style,
}: RoadLinesProps) {
  if (illustration) {
    return <View style={style}>{illustration}</View>;
  }

  return (
    <View style={[styles.wrap, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={0}
          y1={height * 0.5}
          x2={width}
          y2={height * 0.5}
          stroke={color}
          strokeWidth={2}
          strokeDasharray={dashed ? '18 14' : undefined}
          strokeLinecap="round"
          opacity={0.9}
        />
        <Line
          x1={0}
          y1={height * 0.2}
          x2={width}
          y2={height * 0.2}
          stroke={color}
          strokeWidth={1}
          opacity={0.35}
        />
        <Line
          x1={0}
          y1={height * 0.8}
          x2={width}
          y2={height * 0.8}
          stroke={color}
          strokeWidth={1}
          opacity={0.35}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
