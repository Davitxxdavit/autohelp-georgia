import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { obtainDevelopmentJwt } from '@/lib/api/devAuth';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function MechanicLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onContinue = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await obtainDevelopmentJwt();
      if (!ok) {
        Alert.alert(
          'Couldn’t sign in',
          'Development JWT failed. Check EXPO_PUBLIC_API_URL and mechanic seed credentials.',
        );
        return;
      }
      router.replace('/(app)/(tabs)' as Href);
    } finally {
      setBusy(false);
    }
  };

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
        Development JWT for this build. Production authentication will use phone OTP.
      </AppText>
      <PrimaryButton
        label={busy ? 'Signing in…' : 'Continue'}
        disabled={busy}
        onPress={() => {
          void onContinue();
        }}
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
