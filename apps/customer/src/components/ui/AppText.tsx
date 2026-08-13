import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { colors, type ColorToken } from '@/theme/colors';
import { typography, type TypographyVariant } from '@/theme/typography';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: ColorToken;
  style?: StyleProp<TextStyle>;
};

export function AppText({
  variant = 'body',
  color = 'textPrimary',
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[typography[variant], { color: colors[color] }, style]}
    >
      {children}
    </Text>
  );
}
