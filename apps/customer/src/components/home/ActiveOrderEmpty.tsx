import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Surface } from '@/components/ui/Surface';
import { spacing } from '@/theme/spacing';

export function ActiveOrderEmpty() {
  return (
    <Surface elevated padded radiusToken="lg" style={styles.card}>
      <StatusBadge label="აქტიური შეკვეთა არ არის" tone="neutral" />
      <AppText variant="bodyMedium" style={styles.title}>
        აქტიური შეკვეთა არ გაქვს
      </AppText>
      <AppText variant="caption" color="textSecondary">
        როცა დახმარებას გამოიძახებ, აქ გამოჩნდება შეკვეთის სტატუსი.
      </AppText>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  title: {
    marginTop: spacing.xxs,
  },
});
