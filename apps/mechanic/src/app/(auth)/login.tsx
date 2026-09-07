import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { obtainTokenPair } from '@/lib/api/auth';
import { isApiError } from '@/lib/api/errors';
import { setTokenPair } from '@/lib/api/tokens';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('995') && digits.length >= 12) return `+${digits}`;
  if (digits.length === 9 && digits.startsWith('5')) return `+995${digits}`;
  if (raw.trim().startsWith('+') && digits.length >= 8) return `+${digits}`;
  return `+995${digits}`;
}

export default function MechanicLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onContinue = async () => {
    if (busy) return;
    const e164 = toE164(phone);
    if (e164.length < 12 || !password.trim()) {
      setError('Enter your phone and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const tokens = await obtainTokenPair({ phone: e164, password });
      await setTokenPair(tokens);
      router.replace('/(app)/(tabs)' as Href);
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
      <TextInput
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          if (error) setError(null);
        }}
        placeholder="+995 5XX XX XX XX"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        autoComplete="tel"
        accessibilityLabel="Phone number"
        style={styles.input}
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
});
