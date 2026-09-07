import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

function approvalLabel(status: string, verified: boolean): string {
  if (status === 'APPROVED' && verified) return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  if (status === 'SUSPENDED') return 'Suspended';
  return 'Pending approval';
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, signOut } = useMechanicSession();
  const approved = profile.approvalStatus === 'APPROVED' && profile.verified;
  const serviceNames =
    profile.services.length > 0
      ? profile.services.map((item) => item.name)
      : [];

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.xl },
      ]}
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
      <AppText variant="label" color="textMuted">
        Services
      </AppText>
      {serviceNames.length > 0 ? (
        serviceNames.map((name) => (
          <AppText key={name} variant="body">
            {name}
          </AppText>
        ))
      ) : (
        <AppText variant="body" color="textSecondary">
          No services listed yet.
        </AppText>
      )}
      <PrimaryButton
        label="Sign out"
        onPress={() => {
          void (async () => {
            await signOut();
            router.replace('/(auth)/login' as Href);
          })();
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
    gap: spacing.sm,
  },
});
