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
import { formatMoneyAmount } from '@/features/earnings/format';
import { getActiveJobRoute } from '@/features/jobs/routes';
import { JOB_STATUS_LABELS, vehicleLine } from '@/features/jobs/types';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { timing } from '@/animations/timing';
import { spacing } from '@/theme/spacing';

export default function JobCompletedScreen() {
  const router = useRouter();
  const { activeJob, finishJob } = useMechanicSession();
  const earning = activeJob?.earning ?? null;

  useEffect(() => {
    if (!activeJob) return;
    if (activeJob.status !== 'COMPLETED') {
      router.replace(getActiveJobRoute(activeJob.status));
    }
  }, [activeJob, router]);

  const onDone = () => {
    if (!finishJob()) return;
    router.replace('/(app)/(tabs)' as Href);
  };

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
    <JobScreenScaffold footer={<PrimaryButton label="Done" onPress={onDone} />}>
      <Reveal>
        <View style={styles.hero}>
          <CompletionMark />
          <StatusBadge label={JOB_STATUS_LABELS.COMPLETED} tone="success" />
          <AppText variant="h2">Service completed</AppText>
          <AppText variant="body" color="textSecondary">
            {SERVICE_LABELS[activeJob.serviceId]}
          </AppText>
        </View>
      </Reveal>

      {earning ? (
        <Reveal delayMs={timing.instant}>
          <View style={styles.earn}>
            <AppText variant="caption" color="textMuted">
              You earned
            </AppText>
            <AppText variant="display">
              {formatMoneyAmount(earning.netAmount, earning.currency)}
            </AppText>
            <AppText variant="body" color="textSecondary">
              Service price:{' '}
              {formatMoneyAmount(earning.grossAmount, earning.currency)}
            </AppText>
            <AppText variant="body" color="textSecondary">
              AutoHelp commission:{' '}
              {formatMoneyAmount(earning.commissionAmount, earning.currency)}
            </AppText>
          </View>
        </Reveal>
      ) : null}

      <Reveal delayMs={timing.fast}>
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
  earn: {
    gap: spacing.xs,
  },
  facts: {
    gap: spacing.md,
  },
  fact: {
    gap: spacing.xxs,
  },
});
