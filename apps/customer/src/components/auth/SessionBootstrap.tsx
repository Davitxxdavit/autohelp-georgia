import { type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useLaunchGate } from '@/components/branding/LaunchGate';
import { AppText } from '@/components/ui/AppText';
import { useSession } from '@/services/session/SessionProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

/**
 * Blocks the route tree until:
 * 1) AsyncStorage session has loaded
 * 2) launch animation has completed
 *
 * Prevents racing into Home / skipping language before both are known.
 */
export function SessionBootstrap({ children }: { children: ReactNode }) {
  const { initializing } = useSession();
  const { launchComplete } = useLaunchGate();

  if (initializing || !launchComplete) {
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
