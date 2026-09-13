import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhoneNumberInput } from '@/components/auth/PhoneNumberInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { getCopy } from '@/content/copy';
import { isApiError } from '@/lib/api/errors';
import { useSession } from '@/services/session/SessionProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function formatRegisterError(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;
  const firstField = Object.values(error.fieldErrors)[0]?.[0];
  return firstField || error.message || fallback;
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, registerWithPassword } = useSession();
  const copy = getCopy(session.language);
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneValid, setPhoneValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (busy) return;
    const name = firstName.trim();
    if (!name) {
      setError(copy.register.invalidName);
      return;
    }
    if (!phoneValid || !phone) {
      setError(copy.register.invalidPhone);
      return;
    }
    if (!password) {
      setError(copy.register.invalidPassword);
      return;
    }
    if (password !== confirmPassword) {
      setError(copy.register.passwordMismatch);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await registerWithPassword({
        phone,
        password,
        firstName: name,
      });
      router.replace('/(app)/(tabs)');
    } catch (caught) {
      setError(formatRegisterError(caught, copy.register.failed));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.screen,
          {
            paddingTop: insets.top + spacing['2xl'],
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <AppText variant="label" color="primary">
            AutoHelp
          </AppText>
          <AppText variant="h2">{copy.register.title}</AppText>
          <AppText variant="body" color="textSecondary">
            {copy.register.subtitle}
          </AppText>
        </View>

        <View style={styles.form}>
          <TextInput
            value={firstName}
            onChangeText={(value) => {
              setFirstName(value);
              if (error) setError(null);
            }}
            placeholder={copy.register.firstNamePlaceholder}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="givenName"
            accessibilityLabel={copy.register.firstNamePlaceholder}
            style={styles.input}
          />
          <PhoneNumberInput
            error={error && !phoneValid ? error : null}
            placeholder={copy.login.phonePlaceholder}
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
            placeholder={copy.register.passwordPlaceholder}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            accessibilityLabel={copy.register.passwordPlaceholder}
            style={styles.input}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (error) setError(null);
            }}
            placeholder={copy.register.confirmPasswordPlaceholder}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            accessibilityLabel={copy.register.confirmPasswordPlaceholder}
            style={styles.input}
          />
          {error ? (
            <AppText variant="caption" color="danger">
              {error}
            </AppText>
          ) : null}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={busy ? copy.register.submitting : copy.register.submit}
            disabled={busy}
            onPress={() => {
              void onSubmit();
            }}
          />
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={copy.register.signIn}
            disabled={busy}
            onPress={() => router.replace('/(auth)/login' as Href)}
            style={styles.switch}
          >
            <AppText variant="caption" color="textMuted">
              {copy.register.hasAccount}{' '}
              <AppText variant="caption" color="primary">
                {copy.register.signIn}
              </AppText>
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.sm,
    flexGrow: 1,
    justifyContent: 'center',
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    gap: spacing.md,
  },
  switch: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
