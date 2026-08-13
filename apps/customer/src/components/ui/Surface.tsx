import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, type RadiusToken } from '@/theme/radius';
import { shadows, type ShadowToken } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';

export type SurfaceProps = ViewProps & {
  elevated?: boolean;
  radiusToken?: RadiusToken;
  shadow?: ShadowToken;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Surface({
  elevated = false,
  radiusToken = 'lg',
  shadow = 'none',
  padded = false,
  style,
  children,
  ...rest
}: SurfaceProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
          borderRadius: radius[radiusToken],
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? spacing.lg : undefined,
        },
        shadows[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
}
