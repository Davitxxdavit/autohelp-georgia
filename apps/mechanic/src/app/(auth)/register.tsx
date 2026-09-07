import { useEffect, useState } from 'react';
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

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { registerMechanic } from '@/lib/api/auth';
import { isApiError } from '@/lib/api/errors';
import { listActiveServices } from '@/lib/api/services';
import { setTokenPair } from '@/lib/api/tokens';
import type { ApiService } from '@/lib/api/types';
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

function formatRegisterError(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;
  const firstField = Object.values(error.fieldErrors)[0]?.[0];
  return firstField || error.message || fallback;
}

export default function MechanicRegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { checkApproval } = useMechanicSession();
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [services, setServices] = useState<ApiService[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    void listActiveServices()
      .then((next) => {
        if (mounted) setServices(next);
      })
      .catch((caught) => {
        if (mounted) {
          setError(
            formatRegisterError(caught, 'Could not load available services.'),
          );
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const toggleService = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
    if (error) setError(null);
  };

  const onSubmit = async () => {
    if (busy) return;
    const name = firstName.trim();
    if (!name) {
      setError('Enter your first name.');
      return;
    }
    const e164 = toE164(phone);
    if (e164.length < 12) {
      setError('Enter a valid phone number.');
      return;
    }
    if (!password) {
      setError('Enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Select at least one service.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const created = await registerMechanic({
        phone: e164,
        password,
        first_name: name,
        services: selectedIds,
      });
      await setTokenPair({
        access: created.access,
        refresh: created.refresh,
      });
      await checkApproval();
      router.replace('/pending' as Href);
    } catch (caught) {
      setError(formatRegisterError(caught, 'Could not submit application.'));
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
            AutoHelp Mechanic
          </AppText>
          <AppText variant="h2">Apply as a mechanic</AppText>
          <AppText variant="body" color="textSecondary">
            Submit your details and the services you can provide. AutoHelp
            reviews applications before you can receive requests.
          </AppText>
        </View>

        <View style={styles.form}>
          <TextInput
            value={firstName}
            onChangeText={(value) => {
              setFirstName(value);
              if (error) setError(null);
            }}
            placeholder="First name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="givenName"
            accessibilityLabel="First name"
            style={styles.input}
          />
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
            textContentType="newPassword"
            accessibilityLabel="Password"
            style={styles.input}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (error) setError(null);
            }}
            placeholder="Confirm password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            accessibilityLabel="Confirm password"
            style={styles.input}
          />

          <AppText variant="label" color="textMuted">
            Services offered
          </AppText>
          {services.map((service) => {
            const selected = selectedIds.includes(service.id);
            return (
              <Pressable
                key={service.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                onPress={() => toggleService(service.id)}
                style={[styles.service, selected && styles.serviceSelected]}
              >
                <AppText variant="bodyMedium">{service.name}</AppText>
                <AppText variant="caption" color="textMuted">
                  {selected ? 'Selected' : 'Tap to select'}
                </AppText>
              </Pressable>
            );
          })}

          {error ? (
            <AppText variant="caption" color="danger">
              {error}
            </AppText>
          ) : null}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={busy ? 'Submitting…' : 'Submit application'}
            disabled={busy}
            onPress={() => {
              void onSubmit();
            }}
          />
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Sign in"
            disabled={busy}
            onPress={() => router.replace('/(auth)/login' as Href)}
            style={styles.switch}
          >
            <AppText variant="caption" color="textMuted">
              Already have an account?{' '}
              <AppText variant="caption" color="primary">
                Sign in
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
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.sm,
    flexGrow: 1,
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
  service: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xxs,
  },
  serviceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  footer: {
    gap: spacing.md,
  },
  switch: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});
