import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { CompletionMark } from '@/components/job/CompletionMark';
import { JobScreenScaffold } from '@/components/job/JobScreenScaffold';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Reveal } from '@/components/ui/Reveal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SERVICE_LABELS } from '@/constants/services';
import { getActiveJobRoute } from '@/features/jobs/routes';
import { JOB_STATUS_LABELS, vehicleLine } from '@/features/jobs/types';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { timing } from '@/animations/timing';
import { spacing } from '@/theme/spacing';

export default function JobCompletedScreen() {
  const router = useRouter();
  const { activeJob } = useMechanicSession();

  useEffect(() => {
    if (!activeJob) return;
    if (activeJob.status !== 'COMPLETED') {
      router.replace(getActiveJobRoute(activeJob.status));
    }
  }, [activeJob, router]);

  if (!activeJob || activeJob.status !== 'COMPLETED') {
    return (
      <JobScreenScaffold>
        <AppText variant="h2">No completed job</AppText>
        <AppText variant="body" color="textSecondary">
          Finish a roadside service to see this confirmation.
        </AppText>
      </JobScreenScaffold>
    );
  }

  return (
    <JobScreenScaffold
      footer={
        <PrimaryButton
          label="View job summary"
          onPress={() => router.replace('/job/summary' as Href)}
        />
      }
    >
      <Reveal>
        <View style={styles.hero}>
          <CompletionMark />
          <StatusBadge
            label={JOB_STATUS_LABELS.COMPLETED}
            tone="success"
          />
          <AppText variant="h2">Service completed</AppText>
          <AppText variant="body" color="textSecondary">
            {SERVICE_LABELS[activeJob.serviceId]}
          </AppText>
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
            <AppText variant="bodyMedium">{vehicleLine(activeJob)}</AppText>
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
              Estimate — not a paid earning
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
    paddingBottom: spacing.xs,
  },
  facts: {
    gap: spacing.md,
  },
  fact: {
    gap: spacing.xxs,
  },
});
