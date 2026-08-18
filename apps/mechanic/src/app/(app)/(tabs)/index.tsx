import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Reveal } from '@/components/ui/Reveal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SERVICE_LABELS } from '@/constants/services';
import { getActiveJobRoute } from '@/features/jobs/routes';
import { JOB_STATUS_LABELS, vehicleLine } from '@/features/jobs/types';
import { useMechanicSession } from '@/features/session/MechanicSessionProvider';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function MechanicHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, incomingJob, activeJob, setOnline } = useMechanicSession();
  const greeting = greetingForHour(new Date().getHours());

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <AppText variant="label" color="primary">
        AutoHelp Mechanic
      </AppText>
      <AppText variant="h2">
        {greeting}, {profile.name}
      </AppText>

      <AnimatedPressable
        accessibilityLabel={profile.online ? 'Go offline' : 'Go online'}
        accessibilityRole="switch"
        accessibilityState={{ checked: profile.online }}
        onPress={() => setOnline(!profile.online)}
        style={[styles.toggle, profile.online ? styles.toggleOn : styles.toggleOff]}
      >
        <View style={[styles.toggleDot, profile.online ? styles.dotOn : styles.dotOff]} />
        <AppText variant="button" color={profile.online ? 'success' : 'textSecondary'}>
          {profile.online ? 'Online' : 'Offline'}
        </AppText>
      </AnimatedPressable>

      <StatusBadge
        label={
          activeJob
            ? activeJob.status === 'COMPLETED'
              ? 'Job completed'
              : 'On a job'
            : profile.online
              ? 'Available for requests'
              : 'Not taking requests'
        }
        tone={
          activeJob
            ? activeJob.status === 'COMPLETED'
              ? 'success'
              : 'primary'
            : profile.online
              ? 'success'
              : 'neutral'
        }
      />

      {incomingJob ? (
        <Reveal delayMs={timing.instant}>
          <View style={styles.preview}>
            <AppText variant="label" color="primary">
              New request
            </AppText>
            <AppText variant="h3">
              {SERVICE_LABELS[incomingJob.serviceId]}
            </AppText>
            <AppText variant="body" color="textSecondary">
              {vehicleLine(incomingJob)}
            </AppText>
            <AppText variant="body">{incomingJob.problem}</AppText>
            <AppText variant="caption" color="textMuted">
              {incomingJob.distanceKm} km away
            </AppText>
            <AppText variant="caption" color="textMuted">
              Estimated payout
            </AppText>
            <AppText variant="bodyMedium">
              {incomingJob.estimatedPayoutDisplay}
            </AppText>
            <View style={styles.previewCta}>
              <PrimaryButton
                label="View request"
                onPress={() => router.push('/job/incoming' as Href)}
              />
            </View>
          </View>
        </Reveal>
      ) : (
        <View style={styles.empty}>
          <AppText variant="h3">
            {activeJob ? JOB_STATUS_LABELS[activeJob.status] : 'No active job'}
          </AppText>
          <AppText variant="body" color="textSecondary">
            {activeJob
              ? `${SERVICE_LABELS[activeJob.serviceId]} · ${activeJob.customerLabel}`
              : profile.online
                ? 'Nearby requests will show here when a customer needs help.'
                : 'Go online to receive Battery, Diagnostics, and Auto Key requests in Batumi.'}
          </AppText>
          {activeJob ? (
            <PrimaryButton
              label="Continue job"
              onPress={() => router.push(getActiveJobRoute(activeJob.status))}
            />
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  toggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  toggleOn: {
    backgroundColor: colors.successSoft,
    borderColor: colors.border,
  },
  toggleOff: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  dotOn: {
    backgroundColor: colors.success,
  },
  dotOff: {
    backgroundColor: colors.textMuted,
  },
  empty: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  preview: {
    marginTop: spacing.md,
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewCta: {
    paddingTop: spacing.sm,
  },
});
