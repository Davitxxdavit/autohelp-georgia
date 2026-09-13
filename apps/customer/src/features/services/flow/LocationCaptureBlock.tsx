import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import { LiveJobMap } from '@/features/maps/LiveJobMap';
import type { CustomerLocation } from './types';
import type { LocationCapturePhase } from './useDeviceLocationCapture';

const PHASE_COPY: Record<LocationCapturePhase, string> = {
  loading: 'Getting your location...',
  ready: 'Location ready',
  permission_denied: 'Permission denied',
  services_disabled: 'Unable to get location',
  failed: 'Unable to get location',
};

export function LocationCaptureBlock({
  location,
  phase,
  message,
  onRetry,
}: {
  location: CustomerLocation | null;
  phase: LocationCapturePhase;
  message: string | null;
  onRetry: () => void;
}) {
  const retryLabel = phase === 'ready' ? 'Update location' : 'Retry';
  const retryDisabled = phase === 'loading';

  return (
    <>
      <LiveJobMap customerPoint={location?.point ?? null} customerLabel="You" />
      <View style={styles.place}>
        <AppText variant="label" color="primary">
          Current location
        </AppText>
        <AppText variant="h3">
          {phase === 'ready' && location
            ? `📍 ${location.label}`
            : PHASE_COPY[phase]}
        </AppText>
        {message && phase !== 'ready' ? (
          <AppText variant="body" color="textSecondary">
            {message}
          </AppText>
        ) : null}
        {phase === 'ready' && location ? (
          <AppText variant="caption" color="textMuted">
            {location.point.latitude.toFixed(5)},{' '}
            {location.point.longitude.toFixed(5)}
          </AppText>
        ) : null}
      </View>
      <AnimatedPressable
        accessibilityLabel={retryLabel}
        disabled={retryDisabled}
        onPress={onRetry}
        style={[styles.change, retryDisabled && styles.changeDisabled]}
      >
        <AppText variant="button" color="primary">
          {retryLabel}
        </AppText>
      </AnimatedPressable>
    </>
  );
}

const styles = StyleSheet.create({
  place: {
    gap: spacing.xs,
  },
  change: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeDisabled: {
    opacity: 0.45,
  },
});
