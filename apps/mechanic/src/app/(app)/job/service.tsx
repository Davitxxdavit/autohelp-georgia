import { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { JobScreenScaffold } from '@/components/job/JobScreenScaffold';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SERVICE_LABELS } from '@/constants/services';
import { getActiveJobRoute } from '@/features/jobs/routes';
import { JOB_STATUS_LABELS, vehicleLine } from '@/features/jobs/types';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { spacing } from '@/theme/spacing';

export default function JobServiceScreen() {
  const router = useRouter();
  const { activeJob, updateJobStatus } = useMechanicSession();

  useEffect(() => {
    if (!activeJob) return;
    if (activeJob.status !== 'IN_PROGRESS') {
      router.replace(getActiveJobRoute(activeJob.status));
    }
  }, [activeJob, router]);

  const onComplete = () => {
    if (!activeJob) return;
    Alert.alert(
      'Complete service?',
      'Confirm that the roadside assistance has been completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete service',
          onPress: () => {
            const next = updateJobStatus(activeJob.id, 'COMPLETED');
            if (!next) return;
            router.replace(getActiveJobRoute(next.status));
          },
        },
      ],
    );
  };

  if (!activeJob || activeJob.status !== 'IN_PROGRESS') {
    return (
      <JobScreenScaffold>
        <AppText variant="h2">No active service</AppText>
        <AppText variant="body" color="textSecondary">
          Start service from the tracking screen when you arrive.
        </AppText>
      </JobScreenScaffold>
    );
  }

  return (
    <JobScreenScaffold
      footer={
        <PrimaryButton label="Complete service" onPress={onComplete} />
      }
    >
      <View style={styles.hero}>
        <StatusBadge
          label={JOB_STATUS_LABELS.IN_PROGRESS}
          tone="primary"
        />
        <AppText variant="h2">
          {SERVICE_LABELS[activeJob.serviceId]}
        </AppText>
        <AppText variant="body" color="textSecondary">
          Service in progress
        </AppText>
      </View>

      <View style={styles.facts}>
        <View style={styles.fact}>
          <AppText variant="caption" color="textMuted">
            Customer
          </AppText>
          <AppText variant="bodyMedium">{activeJob.customerLabel}</AppText>
        </View>
        <Divider />
        <View style={styles.fact}>
          <AppText variant="caption" color="textMuted">
            Vehicle
          </AppText>
          <AppText variant="bodyMedium">{vehicleLine(activeJob)}</AppText>
        </View>
        <Divider />
        <View style={styles.fact}>
          <AppText variant="caption" color="textMuted">
            Problem
          </AppText>
          <AppText variant="bodyMedium">{activeJob.problem}</AppText>
        </View>
      </View>
    </JobScreenScaffold>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
  },
  facts: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  fact: {
    gap: spacing.xxs,
  },
});
