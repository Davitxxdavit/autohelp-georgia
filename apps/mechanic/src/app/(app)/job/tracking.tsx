import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { JobScreenScaffold } from '@/components/job/JobScreenScaffold';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Reveal } from '@/components/ui/Reveal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SERVICE_LABELS } from '@/constants/services';
import { JobPricePanel } from '@/features/jobs/components/JobPricePanel';
import { LiveJobMap } from '@/features/maps/LiveJobMap';
import {
  ETA_CALCULATING,
  ETA_UNAVAILABLE,
  formatDistanceMeters,
  formatDurationSeconds,
} from '@/features/maps/format';
import { parseGeoPoint } from '@/features/maps/geo';
import { useTripRoute } from '@/features/maps/useTripRoute';
import { getActiveJobRoute } from '@/features/jobs/routes';
import {
  JOB_STATUS_LABELS,
  vehicleLine,
  type JobStatus,
  type MockJob,
} from '@/features/jobs/types';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import {
  alertLocationRequired,
  prepareForegroundGps,
  trackingIssueMessage,
} from '@/features/location/foreground';
import { openPhoneCall } from '@/lib/phone';
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

function TrackingHero({
  job,
  distanceLabel,
  etaLabel,
}: {
  job: MockJob;
  distanceLabel: string | null;
  etaLabel: string | null;
}) {
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
        <AppText variant="h2">{etaLabel ?? ETA_UNAVAILABLE}</AppText>
        {distanceLabel ? (
          <AppText variant="bodyMedium">Customer: {distanceLabel}</AppText>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.hero}>
      <StatusBadge label={JOB_STATUS_LABELS.ACCEPTED} tone="primary" />
      <AppText variant="h2">{service}</AppText>
      <AppText variant="body" color="textSecondary">
        {job.locationLabel}
      </AppText>
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
  const { activeJob, updateJobStatus, proposeJobPrice, livePosition, gpsIssue, retryLiveTracking } =
    useMechanicSession();
  const [busy, setBusy] = useState(false);
  const action = activeJob ? trackingAction(activeJob.status) : null;
  const priceApproved = activeJob?.quoteStatus === 'APPROVED';
  const startBlocked = activeJob?.status === 'ARRIVED' && !priceApproved;
  const customerPoint = activeJob
    ? parseGeoPoint(activeJob.customerLatitude, activeJob.customerLongitude)
    : null;
  const onTheWay = activeJob?.status === 'ON_THE_WAY';
  const { route, loading } = useTripRoute({
    requestId: activeJob?.requestId,
    enabled: Boolean(onTheWay && livePosition),
    origin: livePosition,
  });
  const duration = route?.available
    ? formatDurationSeconds(route.duration_seconds)
    : null;
  const distanceLabel = route?.available
    ? formatDistanceMeters(route.distance_meters)
    : null;
  const etaLabel = duration
    ? `About ${duration}`
    : onTheWay && (loading || !route)
      ? ETA_CALCULATING
      : onTheWay
        ? ETA_UNAVAILABLE
        : null;
  const routeCoordinates = (route?.coordinates ?? [])
    .map((point) => parseGeoPoint(point.latitude, point.longitude))
    .filter((point): point is NonNullable<typeof point> => point != null);

  useEffect(() => {
    if (
      activeJob?.status === 'IN_PROGRESS' ||
      activeJob?.status === 'COMPLETED'
    ) {
      router.replace(getActiveJobRoute(activeJob.status));
    }
  }, [activeJob, router]);

  const onContact = () => {
    if (!activeJob?.customerPhone) return;
    void openPhoneCall(activeJob.customerPhone);
  };

  const onPrimary = () => {
    if (!activeJob || !action || busy) return;
    void (async () => {
      setBusy(true);
      if (action.next === 'ON_THE_WAY') {
        const prep = await prepareForegroundGps();
        if (!prep.ok) {
          setBusy(false);
          alertLocationRequired(prep, () => onPrimary());
          return;
        }
      }
      const next = await updateJobStatus(activeJob.id, action.next);
      setBusy(false);
      if (!next) return;
      if (next.status === 'IN_PROGRESS') {
        router.replace(getActiveJobRoute(next.status));
      }
    })();
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
            <PrimaryButton
              label={
                busy && action.next === 'ON_THE_WAY'
                  ? 'Preparing location…'
                  : busy
                    ? 'Updating…'
                    : startBlocked
                      ? 'Waiting for price approval'
                      : action.label
              }
              disabled={busy || startBlocked}
              onPress={onPrimary}
            />
            {activeJob.customerPhone ? (
              <AnimatedPressable
                accessibilityLabel="Call customer"
                onPress={onContact}
                style={styles.contact}
              >
                <AppText variant="button" color="textSecondary">
                  Call customer
                </AppText>
              </AnimatedPressable>
            ) : null}
          </>
        ) : null
      }
    >
      <Reveal>
        <TrackingHero
          job={activeJob}
          distanceLabel={distanceLabel}
          etaLabel={etaLabel}
        />
      </Reveal>

      <Reveal delayMs={timing.instant}>
        <LiveJobMap
          customerPoint={customerPoint}
          mechanicPoint={livePosition}
          routeCoordinates={onTheWay ? routeCoordinates : []}
          customerLabel="Customer"
          mechanicLabel="You"
          waitingForMechanic={onTheWay && !livePosition}
          bannerText={
            gpsIssue ? trackingIssueMessage(gpsIssue) : 'Getting your location'
          }
        />
      </Reveal>

      {onTheWay && gpsIssue ? (
        <Reveal delayMs={timing.instant}>
          <View style={styles.gpsIssue}>
            <AppText variant="body" color="textSecondary">
              {trackingIssueMessage(gpsIssue)}
            </AppText>
            <AnimatedPressable
              accessibilityLabel="Try again"
              onPress={() => retryLiveTracking()}
              style={styles.gpsAction}
            >
              <AppText variant="button" color="primary">
                Try again
              </AppText>
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityLabel="Open Settings"
              onPress={() => {
                void Linking.openSettings();
              }}
              style={styles.gpsAction}
            >
              <AppText variant="button" color="textSecondary">
                Open Settings
              </AppText>
            </AnimatedPressable>
          </View>
        </Reveal>
      ) : null}

      <Reveal delayMs={timing.fast}>
        <TrackingFacts job={activeJob} />
      </Reveal>
      <Reveal delayMs={timing.normal}>
        <JobPricePanel
          job={activeJob}
          disabled={busy}
          onPropose={(amount) => proposeJobPrice(amount)}
        />
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
  gpsIssue: {
    gap: spacing.sm,
  },
  gpsAction: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
