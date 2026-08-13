import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Surface } from '@/components/ui/Surface';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
      <AppText variant="h2">პროფილი</AppText>
      <AppText variant="body" color="textSecondary" style={styles.subtitle}>
        ანგარიში, ენა და პარამეტრები.
      </AppText>
      <Surface elevated padded style={styles.card}>
        <StatusBadge label="სტუმარი" tone="primary" />
        <AppText variant="bodyMedium" style={styles.title}>
          ავტორიზაცია მალე დაემატება
        </AppText>
        <AppText variant="caption" color="textMuted">
          პროფილის სრული ფუნქციონალი შემდეგ ეტაპზე განხორციელდება.
        </AppText>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  subtitle: {
    marginBottom: spacing.sm,
  },
  card: {
    gap: spacing.sm,
  },
  title: {
    marginTop: spacing.xxs,
  },
});
