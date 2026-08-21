import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme/spacing';

export function RequestPollHint({ pollError }: { pollError: boolean }) {
  if (!pollError) return null;
  return (
    <AppText variant="caption" color="textMuted" style={styles.center}>
      Updating is delayed. Retrying…
    </AppText>
  );
}

export function RequestMissingState({ onHome }: { onHome: () => void }) {
  return (
    <View style={styles.missing}>
      <AppText variant="h2" style={styles.center}>
        This request isn’t available
      </AppText>
      <AppText variant="body" color="textSecondary" style={styles.center}>
        It may have been removed. Check Orders or start a new request from Home.
      </AppText>
      <PrimaryButton label="Back to Home" onPress={onHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  missing: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});
