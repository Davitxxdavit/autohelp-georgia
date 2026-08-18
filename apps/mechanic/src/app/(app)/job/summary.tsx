import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { JobScreenScaffold } from '@/components/job/JobScreenScaffold';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Reveal } from '@/components/ui/Reveal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SERVICE_LABELS } from '@/constants/services';
import { getActiveJobRoute } from '@/features/jobs/routes';
import {
  JOB_STATUS_LABELS,
  vehicleDetail,
} from '@/features/jobs/types';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { timing } from '@/animations/timing';
import { spacing } from '@/theme/spacing';

export default function JobSummaryScreen() {
  const router = useRouter();
  const { activeJob, finishJob } = useMechanicSession();

  useEffect(() => {
    if (!activeJob) return;
    if (activeJob.status !== 'COMPLETED') {
      router.replace(getActiveJobRoute(activeJob.status));
    }
  }, [activeJob, router]);

  const onFinish = () => {
    if (!finishJob()) return;
    router.replace('/(app)/(tabs)');
  };

  if (!activeJob || activeJob.status !== 'COMPLETED') {
    return (
      <JobScreenScaffold>
        <AppText variant="h2">No job summary</AppText>
        <AppText variant="body" color="textSecondary">
          Complete a service to review this job record.
        </AppText>
      </JobScreenScaffold>
    );
  }

  return (
    <JobScreenScaffold
      footer={<PrimaryButton label="Finish job" onPress={onFinish} />}
    >
      <Reveal>
        <View style={styles.hero}>
          <AppText variant="label" color="primary">
            {SERVICE_LABELS[activeJob.serviceId]}
          </AppText>
          <AppText variant="h2">Job summary</AppText>
          <StatusBadge
            label={JOB_STATUS_LABELS.COMPLETED}
            tone="success"
          />
        </View>
      </Reveal>

      <Reveal delayMs={timing.instant}>
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
            <AppText variant="bodyMedium">{vehicleDetail(activeJob)}</AppText>
          </View>
          <Divider />
          <View style={styles.fact}>
            <AppText variant="caption" color="textMuted">
              Problem
            </AppText>
            <AppText variant="bodyMedium">{activeJob.problem}</AppText>
          </View>
          <Divider />
          <View style={styles.fact}>
            <AppText variant="caption" color="textMuted">
              Location
            </AppText>
            <AppText variant="bodyMedium">{activeJob.locationLabel}</AppText>
          </View>
          <Divider />
          <View style={styles.fact}>
            <AppText variant="caption" color="textMuted">
              Estimated payout
            </AppText>
            <AppText variant="bodyMedium">
              {activeJob.estimatedPayoutDisplay}
            </AppText>
            <AppText variant="caption" color="textMuted">
              Estimate — mock catalog
            </AppText>
          </View>
        </View>
      </Reveal>
    </JobScreenScaffold>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
  },
  facts: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  fact: {
    gap: spacing.xxs,
  },
});
