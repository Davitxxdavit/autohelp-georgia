import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function StarRow({
  value,
  onChange,
  size = 'lg',
}: {
  value: number;
  onChange: (next: number) => void;
  size?: 'lg' | 'sm';
}) {
  const stars = [1, 2, 3, 4, 5];
  const fontSize = size === 'lg' ? 36 : 22;

  return (
    <View style={styles.row}>
      {stars.map((star) => {
        const active = star <= value;
        return (
          <AnimatedPressable
            key={star}
            accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
            onPress={() => onChange(star)}
            style={styles.star}
          >
            <AppText
              variant="h2"
              color={active ? 'primary' : 'textMuted'}
              style={{ fontSize, lineHeight: fontSize + 8 }}
            >
              ★
            </AppText>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  star: {
    padding: spacing.xxs,
  },
});
