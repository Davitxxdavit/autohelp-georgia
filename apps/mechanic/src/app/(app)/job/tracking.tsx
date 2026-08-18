import { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { JobScreenScaffold } from '@/components/job/JobScreenScaffold';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Reveal } from '@/components/ui/Reveal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SERVICE_LABELS } from '@/constants/services';
import { MechanicTrackingMap } from '@/features/jobs/components/MechanicTrackingMap';
import {
  MOCK_CUSTOMER_POINT,
  MOCK_MECHANIC_START_POINT,
} from '@/features/jobs/mock';
import { getActiveJobRoute } from '@/features/jobs/routes';
import {
  JOB_STATUS_LABELS,
  vehicleLine,
  type JobStatus,
  type MockJob,
} from '@/features/jobs/types';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { timing } from '@/animations/timing';
import { spacing } from '@/theme/spacing';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="bodyMedium">{value}</AppText>
    </View>
  );
}

function trackingAction(status: JobStatus): {
  label: string;
  next: JobStatus;
} | null {
  if (status === 'ACCEPTED') {
    return { label: 'Start driving', next: 'ON_THE_WAY' };
  }
  if (status === 'ON_THE_WAY') {
    return { label: "I've arrived", next: 'ARRIVED' };
  }
  if (status === 'ARRIVED') {
    return { label: 'Start service', next: 'IN_PROGRESS' };
  }
  return null;
}

function TrackingHero({ job }: { job: MockJob }) {
  const service = SERVICE_LABELS[job.serviceId];

  if (job.status === 'ARRIVED') {
    return (
      <View style={styles.hero}>
        <StatusBadge label={JOB_STATUS_LABELS.ARRIVED} tone="success" />
        <AppText variant="h2">Arrived</AppText>
        <AppText variant="body" color="textSecondary">
          You're at the customer location.
        </AppText>
      </View>
    );
  }

  if (job.status === 'ON_THE_WAY') {
    return (
      <View style={styles.hero}>
        <StatusBadge label={JOB_STATUS_LABELS.ON_THE_WAY} tone="primary" />
        <AppText variant="caption" color="textMuted">
          Arriving in
        </AppText>
        <AppText variant="h2">~{job.etaMinutes} min</AppText>
        <AppText variant="bodyMedium">{job.distanceKm} km</AppText>
      </View>
    );
  }

  return (
    <View style={styles.hero}>
      <StatusBadge label={JOB_STATUS_LABELS.ACCEPTED} tone="primary" />
      <AppText variant="h2">{service}</AppText>
      <AppText variant="h3">{job.distanceKm} km away</AppText>
      <AppText variant="bodyMedium">~{job.etaMinutes} min</AppText>
    </View>
  );
}

function TrackingFacts({ job }: { job: MockJob }) {
  if (job.status === 'ARRIVED') {
    return (
      <View style={styles.facts}>
        <Fact label="Customer" value={job.customerLabel} />
        <Divider />
        <Fact label="Vehicle" value={job.vehicleTitle} />
        <Divider />
        <Fact label="Service" value={SERVICE_LABELS[job.serviceId]} />
      </View>
    );
  }

  if (job.status === 'ON_THE_WAY') {
    return (
      <View style={styles.facts}>
        <Fact label="Customer" value={job.customerLabel} />
        <Divider />
        <Fact label="Vehicle" value={job.vehicleTitle} />
        <Divider />
        <Fact label="Problem" value={job.problem} />
        <Divider />
        <Fact label="Location" value={job.locationLabel} />
      </View>
    );
  }

  return (
    <View style={styles.facts}>
      <Fact label="Customer" value={job.customerLabel} />
      <Divider />
      <Fact label="Vehicle" value={vehicleLine(job)} />
      <Divider />
      <Fact label="Problem" value={job.problem} />
    </View>
  );
}

export default function JobTrackingScreen() {
  const router = useRouter();
  const { activeJob, updateJobStatus } = useMechanicSession();
  const action = activeJob ? trackingAction(activeJob.status) : null;

  useEffect(() => {
    if (
      activeJob?.status === 'IN_PROGRESS' ||
      activeJob?.status === 'COMPLETED'
    ) {
      router.replace(getActiveJobRoute(activeJob.status));
    }
  }, [activeJob, router]);

  const onContact = () => {
    Alert.alert(
      'Contact customer',
      'Calling will be available when phone integration is connected.',
    );
  };

  const onPrimary = () => {
    if (!activeJob || !action) return;
    const next = updateJobStatus(activeJob.id, action.next);
    if (!next) return;
    if (next.status === 'IN_PROGRESS') {
      router.replace(getActiveJobRoute(next.status));
    }
  };

  if (!activeJob) {
    return (
      <JobScreenScaffold>
        <AppText variant="h2">No active trip</AppText>
        <AppText variant="body" color="textSecondary">
          Accept a nearby request to start driving to the customer.
        </AppText>
      </JobScreenScaffold>
    );
  }

  if (activeJob.status === 'IN_PROGRESS' || activeJob.status === 'COMPLETED') {
    return (
      <JobScreenScaffold>
        <AppText variant="h2">
          {activeJob.status === 'COMPLETED'
            ? 'Service completed'
            : 'Service in progress'}
        </AppText>
        <AppText variant="body" color="textSecondary">
          Opening the next step.
        </AppText>
      </JobScreenScaffold>
    );
  }

  return (
    <JobScreenScaffold
      footer={
        action ? (
          <>
            <PrimaryButton label={action.label} onPress={onPrimary} />
            <AnimatedPressable
              accessibilityLabel="Contact customer"
              onPress={onContact}
              style={styles.contact}
            >
              <AppText variant="button" color="textSecondary">
                Contact customer
              </AppText>
            </AnimatedPressable>
          </>
        ) : null
      }
    >
      <Reveal>
        <TrackingHero job={activeJob} />
      </Reveal>

      <Reveal delayMs={timing.instant}>
        <MechanicTrackingMap
          mechanicPoint={MOCK_MECHANIC_START_POINT}
          customerPoint={MOCK_CUSTOMER_POINT}
          status={activeJob.status}
        />
      </Reveal>

      <Reveal delayMs={timing.fast}>
        <TrackingFacts job={activeJob} />
      </Reveal>
    </JobScreenScaffold>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xs,
  },
  facts: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  fact: {
    gap: spacing.xxs,
  },
  contact: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
