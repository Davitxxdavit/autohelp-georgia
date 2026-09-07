import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { JobScreenScaffold } from '@/components/job/JobScreenScaffold';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Reveal } from '@/components/ui/Reveal';
import { SERVICE_LABELS } from '@/constants/services';
import { getActiveJobRoute } from '@/features/jobs/routes';
import { vehicleDetail } from '@/features/jobs/types';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { timing } from '@/animations/timing';
import { spacing } from '@/theme/spacing';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="bodyMedium">{value}</AppText>
    </View>
  );
}

export default function JobDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getJob, acceptJob, declineJob, activeJob } = useMechanicSession();
  const job = typeof id === 'string' ? getJob(id) : undefined;
  const decided = activeJob?.id === job?.id;
  const [busy, setBusy] = useState(false);

  const onDecline = () => {
    if (!job || busy) return;
    Alert.alert('Decline request?', 'This request will be declined.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            const ok = await declineJob(job.id);
            setBusy(false);
            if (!ok) {
              Alert.alert(
                'Couldn’t decline',
                'Check your connection and try again.',
              );
              return;
            }
            router.replace('/(app)/(tabs)');
          })();
        },
      },
    ]);
  };

  const onAccept = () => {
    if (!job || busy) return;
    void (async () => {
      setBusy(true);
      const next = await acceptJob(job.id);
      setBusy(false);
      if (!next) {
        Alert.alert(
          'Couldn’t accept',
          'This request may already be claimed, or the offer is no longer valid.',
        );
        router.replace('/(app)/(tabs)');
        return;
      }
      router.replace(getActiveJobRoute(next.status));
    })();
  };

  if (!job) {
    return (
      <JobScreenScaffold>
        <AppText variant="h2">Request not found</AppText>
        <AppText variant="body" color="textSecondary">
          This request is no longer available.
        </AppText>
      </JobScreenScaffold>
    );
  }

  return (
    <JobScreenScaffold
      footer={
        decided ? (
          <PrimaryButton
            label="Continue"
            onPress={() => router.replace(getActiveJobRoute(job.status))}
          />
        ) : (
          <>
            <PrimaryButton
              label={busy ? 'Working…' : 'Accept request'}
              disabled={busy}
              onPress={onAccept}
            />
            <AnimatedPressable
              accessibilityLabel="Decline"
              onPress={onDecline}
              style={styles.decline}
            >
              <AppText variant="button" color="textSecondary">
                Decline
              </AppText>
            </AnimatedPressable>
          </>
        )
      }
    >
      <Reveal>
        <View style={styles.hero}>
          <AppText variant="label" color="primary">
            {SERVICE_LABELS[job.serviceId]}
          </AppText>
          <AppText variant="h2">{job.distanceKm} km away</AppText>
          <AppText variant="caption" color="textMuted">
            ~{job.etaMinutes} min to customer
          </AppText>
        </View>
      </Reveal>

      <Reveal delayMs={timing.instant}>
        <View style={styles.details}>
          <Row label="Customer" value={job.customerLabel} />
          <Divider />
          <Row label="Vehicle" value={vehicleDetail(job)} />
          <Divider />
          <Row label="Problem" value={job.problem} />
          <Divider />
          <Row label="Location" value={job.locationLabel} />
          <Divider />
          <View style={styles.row}>
            <AppText variant="caption" color="textMuted">
              Estimated payout
            </AppText>
            <AppText variant="bodyMedium">{job.estimatedPayoutDisplay}</AppText>
            <AppText variant="caption" color="textMuted">
              Catalog estimate — not a guaranteed earning
            </AppText>
          </View>
        </View>
      </Reveal>
    </JobScreenScaffold>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  details: {
    gap: spacing.md,
  },
  row: {
    gap: spacing.xxs,
  },
  decline: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
