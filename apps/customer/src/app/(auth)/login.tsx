import { useCallback, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, signInWithPassword, resetAppStateForDev } = useSession();
  const copy = getCopy(session.language);
  const [phone, setPhone] = useState<string | null>(null);
  const [phoneValid, setPhoneValid] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const onContinue = async () => {
    if (busy) return;
    if (!phoneValid || !phone) {
      setError(copy.login.invalidPhone);
      return;
    }
    if (!password.trim()) {
      setError(copy.login.invalidPassword);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signInWithPassword(phone, password);
      router.replace('/(app)/(tabs)');
    } catch (caught) {
      setError(
        isApiError(caught) ? caught.message : copy.login.signInFailed,
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
      <View style={styles.header}>
        <Pressable
          onLongPress={
            __DEV__
              ? () => {
                  void (async () => {
                    await resetAppStateForDev();
                    Alert.alert(
                      'DEV reset',
                      'Cleared language, onboarding, and auth session.',
                    );
                  })();
                }
              : undefined
          }
          delayLongPress={600}
          accessibilityRole="text"
        >
          <AppText variant="label" color="primary">
            AutoHelp
          </AppText>
        </Pressable>
        <AppText variant="h2">{copy.login.title}</AppText>
        <AppText variant="body" color="textSecondary">
          {copy.login.subtitle}
        </AppText>
      </View>

      <View style={styles.form}>
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
          placeholder={copy.login.passwordPlaceholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          accessibilityLabel={copy.login.passwordPlaceholder}
          style={styles.password}
        />
        {error ? (
          <AppText variant="caption" color="danger">
            {error}
          </AppText>
        ) : null}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={busy ? copy.login.signingIn : copy.login.continue}
          disabled={busy}
          onPress={() => {
            void onContinue();
          }}
        />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={copy.login.createAccount}
          disabled={busy}
          onPress={() => router.push('/(auth)/register' as Href)}
          style={styles.switch}
        >
          <AppText variant="caption" color="textMuted">
            {copy.login.createAccountPrompt}{' '}
            <AppText variant="caption" color="primary">
              {copy.login.createAccount}
            </AppText>
          </AppText>
        </Pressable>
        <AppText variant="caption" color="textMuted" style={styles.legal}>
          {copy.login.legal}
        </AppText>
        <View style={styles.links}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={copy.login.terms}
            onPress={() => Alert.alert(copy.login.terms, 'Placeholder — coming soon.')}
          >
            <AppText variant="caption" color="primary">
              {copy.login.terms}
            </AppText>
          </Pressable>
          <AppText variant="caption" color="textMuted">
            ·
          </AppText>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={copy.login.privacy}
            onPress={() =>
              Alert.alert(copy.login.privacy, 'Placeholder — coming soon.')
            }
          >
            <AppText variant="caption" color="primary">
              {copy.login.privacy}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  password: {
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
  legal: {
    textAlign: 'center',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
});
