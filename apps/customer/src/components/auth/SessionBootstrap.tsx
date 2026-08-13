import { type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useSession } from '@/services/session/SessionProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

/**
 * Blocks route tree until AsyncStorage session has loaded.
 * Prevents racing into Home before language / onboarding / auth are known.
 */
export function SessionBootstrap({ children }: { children: ReactNode }) {
  const { isLoading } = useSession();

  // Do not mount the router tree (or AuthRedirect) while session is still loading.
  if (isLoading) {
    return (
      <View style={styles.root} accessibilityLabel="Loading AutoHelp">
        <AppText variant="label" color="primary">
          AutoHelp
        </AppText>
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  spinner: {
    marginTop: spacing.sm,
  },
});
