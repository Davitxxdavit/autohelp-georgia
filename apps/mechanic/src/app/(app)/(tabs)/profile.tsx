import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { isApiError } from '@/lib/api/errors';
import { patchMechanicMe } from '@/lib/api/mechanic';
import { listActiveServices } from '@/lib/api/services';
import type { ApiService } from '@/lib/api/types';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function approvalLabel(status: string, verified: boolean): string {
  if (status === 'APPROVED' && verified) return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  if (status === 'SUSPENDED') return 'Suspended';
  return 'Pending approval';
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, signOut, checkApproval } = useMechanicSession();
  const approved = profile.approvalStatus === 'APPROVED' && profile.verified;
  const [catalog, setCatalog] = useState<ApiService[]>([]);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [savingName, setSavingName] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const selectedIds = new Set(profile.services.map((item) => item.id));

  useEffect(() => {
    setFirstName(profile.firstName);
  }, [profile.firstName]);

  useEffect(() => {
    void listActiveServices()
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, []);

  const onSaveName = async () => {
    const next = firstName.trim();
    if (!next || next === profile.firstName || savingName) return;
    setSavingName(true);
    try {
      await patchMechanicMe({ first_name: next });
      await checkApproval();
    } catch (error) {
      Alert.alert(
        'Couldn’t save',
        isApiError(error) ? error.message : 'Try again.',
      );
    } finally {
      setSavingName(false);
    }
  };

  const onToggleService = async (serviceId: string, enabled: boolean) => {
    const next = new Set(selectedIds);
    if (enabled) next.add(serviceId);
    else next.delete(serviceId);
    if (next.size === 0) {
      Alert.alert('Services', 'Keep at least one service enabled.');
      return;
    }
    setSavingServices(true);
    try {
      await patchMechanicMe({ services: Array.from(next) });
      await checkApproval();
    } catch (error) {
      Alert.alert(
        'Couldn’t update services',
        isApiError(error) ? error.message : 'Try again.',
      );
    } finally {
      setSavingServices(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="h2">{profile.name || 'Mechanic'}</AppText>
      <StatusBadge
        label={approvalLabel(profile.approvalStatus, profile.verified)}
        tone={approved ? 'success' : 'neutral'}
      />
      <AppText variant="body" color="textSecondary">
        {profile.phone || '—'}
      </AppText>
      <AppText variant="caption" color="textMuted">
        {profile.online ? 'Online' : 'Offline'}
        {Number.isFinite(profile.rating) && profile.rating > 0
          ? ` · ★ ${profile.rating.toFixed(1)}`
          : ''}
      </AppText>
      <AppText variant="caption" color="textMuted">
        First name
      </AppText>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
        autoCapitalize="words"
      />
      <PrimaryButton
        label={savingName ? 'Saving…' : 'Save name'}
        disabled={savingName || firstName.trim() === profile.firstName}
        onPress={() => {
          void onSaveName();
        }}
      />
      <AppText variant="label" color="textMuted">
        Services I provide
      </AppText>
      {catalog.map((service) => (
        <Pressable
          key={service.id}
          style={styles.serviceRow}
          onPress={() => {
            void onToggleService(service.id, !selectedIds.has(service.id));
          }}
          disabled={savingServices}
        >
          <AppText variant="body">{service.name}</AppText>
          <Switch
            value={selectedIds.has(service.id)}
            onValueChange={(value) => {
              void onToggleService(service.id, value);
            }}
            disabled={savingServices}
          />
        </Pressable>
      ))}
      <PrimaryButton
        label="Job history"
        onPress={() => router.push('/history' as Href)}
      />
      <PrimaryButton
        label="Sign out"
        onPress={() => {
          void (async () => {
            await signOut();
            router.replace('/(auth)/login' as Href);
          })();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
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
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
});
