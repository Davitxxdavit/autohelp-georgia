import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function MechanicLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + spacing['2xl'],
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <AppText variant="label" color="primary">
        AutoHelp Mechanic
      </AppText>
      <AppText variant="h2">Sign in</AppText>
      <AppText variant="body" color="textSecondary">
        Mock entry for this build. Real authentication comes later.
      </AppText>
      <PrimaryButton
        label="Continue (mock)"
        onPress={() => router.replace('/(app)/(tabs)' as Href)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    justifyContent: 'center',
  },
});
