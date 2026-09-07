import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { isApiError } from '@/lib/api/errors';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function MechanicPendingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, isApproved, checkApproval, signOut } = useMechanicSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isApproved) {
      router.replace('/(app)/(tabs)' as Href);
    }
  }, [isApproved, router]);

  const onRefresh = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const approved = await checkApproval();
      if (approved) {
        router.replace('/(app)/(tabs)' as Href);
      }
    } catch (caught) {
      setError(
        isApiError(caught)
          ? caught.message
          : 'Could not check approval status.',
      );
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    await signOut();
    router.replace('/(auth)/login' as Href);
  };

  const serviceNames = profile.services.map((item) => item.name).filter(Boolean);

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
      <AppText variant="h2">Application submitted</AppText>
      <AppText variant="body" color="textSecondary">
        Thank you for joining AutoHelp.
      </AppText>
      <AppText variant="body" color="textSecondary">
        Your mechanic account needs to be reviewed and approved by the AutoHelp
        team before you can start receiving requests.
      </AppText>
      <AppText variant="body" color="textSecondary">
        Once your application is approved, you&apos;ll be able to access mechanic
        features and start receiving requests.
      </AppText>
      <StatusBadge label="Status: Pending approval" tone="neutral" />

      {profile.firstName ? (
        <AppText variant="bodyMedium">{profile.firstName}</AppText>
      ) : null}
      {profile.phone ? (
        <AppText variant="caption" color="textMuted">
          {profile.phone}
        </AppText>
      ) : null}
      {serviceNames.length > 0 ? (
        <AppText variant="caption" color="textMuted">
          {serviceNames.join(' · ')}
        </AppText>
      ) : null}

      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}

      <PrimaryButton
        label={busy ? 'Checking…' : 'Check approval status'}
        disabled={busy}
        onPress={() => {
          void onRefresh();
        }}
      />
      <PrimaryButton
        label="Log out"
        disabled={busy}
        onPress={() => {
          void onLogout();
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
