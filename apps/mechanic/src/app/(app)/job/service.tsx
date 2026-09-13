import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { JobScreenScaffold } from '@/components/job/JobScreenScaffold';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SERVICE_LABELS } from '@/constants/services';
import { getActiveJobRoute } from '@/features/jobs/routes';
import { JOB_STATUS_LABELS, vehicleLine } from '@/features/jobs/types';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { openPhoneCall } from '@/lib/phone';
import { spacing } from '@/theme/spacing';

export default function JobServiceScreen() {
  const router = useRouter();
  const { activeJob, updateJobStatus } = useMechanicSession();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!activeJob) return;
    if (activeJob.status !== 'IN_PROGRESS') {
      router.replace(getActiveJobRoute(activeJob.status));
    }
  }, [activeJob, router]);

  const onComplete = () => {
    if (!activeJob || busy) return;
    Alert.alert(
      'Complete service?',
      'Confirm that the roadside assistance has been completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete service',
          onPress: () => {
            setBusy(true);
            void (async () => {
              const next = await updateJobStatus(activeJob.id, 'COMPLETED');
              setBusy(false);
              if (!next) return;
              router.replace(getActiveJobRoute(next.status));
            })();
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
        <>
          {activeJob.customerPhone ? (
            <AnimatedPressable
              accessibilityLabel="Call customer"
              onPress={() => {
                void openPhoneCall(activeJob.customerPhone);
              }}
              style={styles.contact}
            >
              <AppText variant="button" color="textSecondary">
                Call customer
              </AppText>
            </AnimatedPressable>
          ) : null}
          <PrimaryButton
            label={busy ? 'Completing…' : 'Complete service'}
            disabled={busy}
            onPress={onComplete}
          />
        </>
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
            Service price
          </AppText>
          <AppText variant="bodyMedium">
            {activeJob.estimatedPayoutDisplay}
          </AppText>
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
  contact: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
