import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export type HomeHeaderProps = {
  onLocationPress?: () => void;
};

export function HomeHeader({ onLocationPress }: HomeHeaderProps) {
  return (
    <View style={styles.root}>
      <AppText variant="h2">გამარჯობა 👋</AppText>
      <AppText variant="body" color="textSecondary" style={styles.subtitle}>
        რით შეგვიძლია დაგეხმაროთ?
      </AppText>

      <AnimatedPressable
        accessibilityLabel="მდებარეობა: ბათუმი. შეცვლა მოგვიანებით იქნება ხელმისაწვდომი"
        accessibilityRole="button"
        onPress={onLocationPress}
        style={styles.location}
      >
        <AppText variant="bodyMedium" color="textPrimary">
          📍 ბათუმი
        </AppText>
        <AppText variant="caption" color="textMuted">
          შეცვლა
        </AppText>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.xs,
  },
  location: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
