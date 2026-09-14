import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Surface } from '@/components/ui/Surface';
import { getCurrentUser, updateCurrentUser } from '@/lib/api/auth';
import { isApiError } from '@/lib/api/errors';
import type { CurrentUser } from '@/lib/api/types';
import { useSession } from '@/services/session/SessionProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { session, signOut, resetAppStateForDev } = useSession();
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [firstNameDraft, setFirstNameDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const next = await getCurrentUser();
      setMe(next);
      setFirstNameDraft(next.first_name ?? '');
      setLoadError(null);
    } catch (error) {
      setLoadError(
        isApiError(error)
          ? error.message
          : 'Could not load profile.',
      );
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const onResetSession = () => {
    Alert.alert(
      'Reset App Session',
      'Clear language, onboarding, and mock auth? The first-launch flow will start again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            void resetAppStateForDev();
          },
        },
      ],
    );
  };

  const firstName = me?.first_name?.trim() || 'Customer';
  const phone = me?.phone || session.phone || '—';
  const role = me?.role || 'CUSTOMER';
  const canSaveName =
    firstNameDraft.trim().length > 0 &&
    firstNameDraft.trim() !== (me?.first_name ?? '') &&
    !saving;

  const onSaveName = async () => {
    if (!canSaveName) return;
    setSaving(true);
    try {
      const next = await updateCurrentUser({ first_name: firstNameDraft.trim() });
      setMe(next);
      setFirstNameDraft(next.first_name);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        isApiError(error) ? error.message : 'Could not update name.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
      <AppText variant="h2">პროფილი</AppText>
      <AppText variant="body" color="textSecondary" style={styles.subtitle}>
        ანგარიში და პარამეტრები.
      </AppText>
      <Surface elevated padded style={styles.card}>
        <StatusBadge label={role} tone="primary" />
        <AppText variant="bodyMedium" style={styles.title}>
          {firstName}
        </AppText>
        <AppText variant="caption" color="textMuted">
          {phone}
        </AppText>
        <AppText variant="caption" color="textMuted">
          First name
        </AppText>
        <TextInput
          value={firstNameDraft}
          onChangeText={setFirstNameDraft}
          autoCapitalize="words"
          placeholder="First name"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <PrimaryButton
          label={saving ? 'Saving…' : 'Save name'}
          disabled={!canSaveName}
          onPress={() => {
            void onSaveName();
          }}
        />
        {loadError ? (
          <AppText variant="caption" color="danger">
            {loadError}
          </AppText>
        ) : null}
        <PrimaryButton
          label="Sign out"
          onPress={() => {
            void signOut();
          }}
          accessibilityLabel="Sign out"
        />
      </Surface>

      {__DEV__ ? (
        <Surface elevated padded style={styles.card}>
          <AppText variant="label" color="textMuted">
            Development
          </AppText>
          <AppText variant="bodyMedium">Reset App Session</AppText>
          <AppText variant="caption" color="textMuted">
            Clears AutoHelp language, onboarding, and mock auth keys only.
          </AppText>
          <PrimaryButton
            label="Reset App Session"
            onPress={onResetSession}
            accessibilityLabel="Reset App Session"
          />
        </Surface>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  subtitle: {
    marginBottom: spacing.sm,
  },
  card: {
    gap: spacing.sm,
  },
  title: {
    marginTop: spacing.xxs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
  },
});
