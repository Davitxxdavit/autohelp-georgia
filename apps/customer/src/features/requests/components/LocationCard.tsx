import { Alert, StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Surface } from '@/components/ui/Surface';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export type LocationCardProps = {
  label?: string;
  cityLabel?: string;
};

/**
 * Location placeholder ready for expo-location later.
 * Does not use real GPS or coordinates in Step 5.
 */
export function LocationCard({
  label = 'მდებარეობა',
  cityLabel = 'ბათუმი',
}: LocationCardProps) {
  return (
    <Surface elevated padded radiusToken="lg" style={styles.card}>
      <AppText variant="caption" color="textMuted">
        📍 {label}
      </AppText>
      <AppText variant="h3">{cityLabel}</AppText>
      <AnimatedPressable
        accessibilityLabel="მდებარეობის არჩევა"
        onPress={() => {
          Alert.alert(
            'მდებარეობა',
            'Location functionality will be connected in the next step.',
          );
        }}
        style={styles.button}
      >
        <AppText variant="button" color="primary">
          მდებარეობის არჩევა
        </AppText>
      </AnimatedPressable>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  button: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
