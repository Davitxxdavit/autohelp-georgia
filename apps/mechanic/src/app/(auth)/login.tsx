import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhoneNumberInput } from '@/components/auth/PhoneNumberInput';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { obtainTokenPair } from '@/lib/api/auth';
import { isApiError } from '@/lib/api/errors';
import { setTokenPair } from '@/lib/api/tokens';
import { useServerWakeCopy } from '@/lib/useServerWakeCopy';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function MechanicLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { checkApproval } = useMechanicSession();
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneValid, setPhoneValid] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const wakeCopy = useServerWakeCopy(busy);

  const onContinue = async () => {
    if (busy) return;
    if (!phoneValid || !phone) {
      setError('Enter a valid phone number.');
      return;
    }
    if (!password.trim()) {
      setError('Enter your password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const tokens = await obtainTokenPair({ phone, password });
      await setTokenPair(tokens);
      const approved = await checkApproval();
      router.replace((approved ? '/(app)/(tabs)' : '/pending') as Href);
    } catch (caught) {
      setError(
        isApiError(caught)
          ? caught.message
          : 'Couldn’t sign in. Check phone, password, and connection.',
      );
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
        Phone and password JWT for this build. Production authentication will use
        phone OTP.
      </AppText>
      <PhoneNumberInput
        error={error && !phoneValid ? error : null}
        placeholder="555 12 34 56"
        disabled={busy}
        onChange={(value) => {
          setPhone(value.e164);
          setPhoneValid(value.isValid);
          if (error) setError(null);
        }}
      />
      <TextInput
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          if (error) setError(null);
        }}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        accessibilityLabel="Password"
        style={styles.input}
      />
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}
      {wakeCopy ? (
        <AppText variant="caption" color="textMuted">
          {wakeCopy}
        </AppText>
      ) : null}
      <PrimaryButton
        label={busy ? 'Signing in…' : 'Continue'}
        disabled={busy}
        onPress={() => {
          void onContinue();
        }}
      />
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Apply as a mechanic"
        disabled={busy}
        onPress={() => router.push('/(auth)/register' as Href)}
        style={styles.switch}
      >
        <AppText variant="caption" color="textMuted">
          Don&apos;t have an account?{' '}
          <AppText variant="caption" color="primary">
            Apply as a mechanic
          </AppText>
        </AppText>
      </Pressable>
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
  input: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switch: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
