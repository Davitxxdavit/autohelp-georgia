import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SERVICE_LABELS } from '@/constants/services';
import { getActiveJobRoute } from '@/features/jobs/routes';
import { JOB_STATUS_LABELS } from '@/features/jobs/types';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeJob } = useMechanicSession();

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.xl },
      ]}
    >
      <AppText variant="h2">Jobs</AppText>

      {activeJob ? (
        <AnimatedPressable
          accessibilityLabel="Open active job"
          onPress={() => router.push(getActiveJobRoute(activeJob.status))}
          style={styles.card}
        >
          <AppText variant="label" color="primary">
            {activeJob.status === 'COMPLETED' ? 'Completed' : 'Active'}
          </AppText>
          <AppText variant="h3">
            {SERVICE_LABELS[activeJob.serviceId]}
          </AppText>
          <AppText variant="body" color="textSecondary">
            {activeJob.customerLabel} · {activeJob.locationLabel}
          </AppText>
          <StatusBadge
            label={JOB_STATUS_LABELS[activeJob.status]}
            tone={activeJob.status === 'COMPLETED' ? 'success' : 'primary'}
          />
        </AnimatedPressable>
      ) : (
        <View style={styles.empty}>
          <AppText variant="h3">No active jobs</AppText>
          <AppText variant="body" color="textSecondary">
            Accepted roadside jobs will appear here.
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    gap: spacing.sm,
  },
});
