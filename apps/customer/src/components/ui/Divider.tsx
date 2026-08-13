import { View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type DividerProps = {
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Divider({ vertical = false, style }: DividerProps) {
  return (
    <View
      accessibilityRole="none"
      style={[
        {
          backgroundColor: colors.border,
          ...(vertical
            ? { width: 1, alignSelf: 'stretch', marginHorizontal: spacing.sm }
            : { height: 1, alignSelf: 'stretch', marginVertical: spacing.sm }),
        },
        style,
      ]}
    />
  );
}
