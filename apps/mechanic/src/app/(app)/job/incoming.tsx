import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { JobScreenScaffold } from '@/components/job/JobScreenScaffold';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Reveal } from '@/components/ui/Reveal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SERVICE_LABELS } from '@/constants/services';
import { vehicleLine } from '@/features/jobs/types';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { timing } from '@/animations/timing';
import { spacing } from '@/theme/spacing';

export default function IncomingJobScreen() {
  const router = useRouter();
  const { incomingJob, activeJob } = useMechanicSession();
  const job = incomingJob ?? activeJob;

  if (!job) {
    return (
      <JobScreenScaffold>
        <AppText variant="h2">No request</AppText>
        <AppText variant="body" color="textSecondary">
          There is no nearby request right now.
        </AppText>
      </JobScreenScaffold>
    );
  }

  return (
    <JobScreenScaffold
      footer={
        <>
          <PrimaryButton
            label="Review request"
            onPress={() => router.push(`/job/${job.id}` as Href)}
          />
          <AnimatedPressable
            accessibilityLabel="Not now"
            onPress={() => router.back()}
            style={styles.secondary}
          >
            <AppText variant="button" color="textSecondary">
              Not now
            </AppText>
          </AnimatedPressable>
        </>
      }
    >
      <Reveal>
        <View style={styles.hero}>
          <StatusBadge label="New roadside request" tone="primary" />
          <AppText variant="h2">{SERVICE_LABELS[job.serviceId]}</AppText>
          <AppText variant="body" color="textSecondary">
            Customer needs help nearby.
          </AppText>
        </View>
      </Reveal>

      <Reveal delayMs={timing.instant}>
        <View style={styles.facts}>
          <AppText variant="caption" color="textMuted">
            Customer
          </AppText>
          <AppText variant="bodyMedium">{job.customerLabel}</AppText>
          <AppText variant="caption" color="textMuted">
            Vehicle
          </AppText>
          <AppText variant="bodyMedium">{vehicleLine(job)}</AppText>
          <AppText variant="caption" color="textMuted">
            Problem
          </AppText>
          <AppText variant="bodyMedium">{job.problem}</AppText>
          <AppText variant="caption" color="textMuted">
            Location
          </AppText>
          <AppText variant="bodyMedium">{job.locationLabel}</AppText>
          <AppText variant="caption" color="textMuted">
            Service price
          </AppText>
          <AppText variant="bodyMedium">{job.estimatedPayoutDisplay}</AppText>
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
    gap: spacing.xxs,
    paddingTop: spacing.sm,
  },
  secondary: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
