import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SERVICE_LABELS } from '@/constants/services';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useMechanicSession();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.xl },
      ]}
    >
      <AppText variant="h2">{profile.name}</AppText>
      <StatusBadge
        label={profile.verified ? 'Verified' : 'Unverified'}
        tone={profile.verified ? 'success' : 'neutral'}
      />
      <AppText variant="body" color="textSecondary">
        ★ {profile.rating.toFixed(1)} · Batumi, Georgia
      </AppText>
      <AppText variant="label" color="textMuted">
        Services
      </AppText>
      {profile.supportedServices.map((id) => (
        <AppText key={id} variant="body">
          {SERVICE_LABELS[id]}
        </AppText>
      ))}
      <AppText variant="caption" color="textMuted">
        Mock session — real sign-in comes later.
      </AppText>
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
