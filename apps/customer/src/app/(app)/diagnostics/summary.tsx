import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { Surface } from '@/components/ui/Surface';
import { FadeIn } from '@/features/services/flow/FadeIn';
import { ServiceScreenHeader } from '@/features/services/flow/ServiceScreenHeader';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import { useDiagnosticsFlow } from '@/features/services/diagnostics/DiagnosticsFlowProvider';
import {
  getDiagnosticsOption,
  getDiagnosticsProblem,
} from '@/features/services/diagnostics/mock';
import { isUsableDeviceLocation } from '@/features/services/flow/location';
import { vehicleSubtitle, vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { isApiError } from '@/lib/api/errors';
import { resolveDiagnosticsProblemCode } from '@/lib/api/mapping';
import { createRoadsideRequest } from '@/lib/api/requests';
import { colors } from '@/theme/colors';
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

export default function DiagnosticsSummaryScreen() {
  const router = useRouter();
  const { draft, markRequested } = useDiagnosticsFlow();
  const { getById } = useVehicles();
  const vehicle = draft.vehicleId ? getById(draft.vehicleId) : undefined;
  const option = draft.optionId
    ? getDiagnosticsOption(draft.optionId)
    : undefined;
  const problem = draft.problemId
    ? getDiagnosticsProblem(draft.problemId)
    : undefined;
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    Boolean(vehicle && option && problem) &&
    isUsableDeviceLocation(draft.location) &&
    !submitting;

  const onRequestDiagnostics = async () => {
    if (
      !vehicle ||
      !option ||
      !problem ||
      !draft.problemId ||
      !isUsableDeviceLocation(draft.location) ||
      submitting
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const created = await createRoadsideRequest({
        frontendServiceId: 'diagnostics',
        problemCode: resolveDiagnosticsProblemCode(draft.problemId),
        vehicleId: vehicle.id,
        latitude: draft.location.point.latitude,
        longitude: draft.location.point.longitude,
        address: draft.location.label,
      });
      markRequested({
        id: created.id,
        estimatedPriceAmount: created.estimated_price_amount,
        estimatedPriceCurrency: created.estimated_price_currency,
      });
      router.push('/diagnostics/searching' as Href);
    } catch (error) {
      if (__DEV__) {
        console.warn('[AutoHelp] Diagnostics request create failed', error);
        if (isApiError(error)) {
          console.warn('[AutoHelp] status', error.status, 'body', error.body);
        }
      }
      Alert.alert(
        'Request failed',
        'Couldn’t send your request. Check your connection and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ServiceScreenHeader
        title="Request summary"
        subtitle="Review before we look for a specialist"
      />
      <FadeIn>
        <ServiceScreenScaffold
          contentContainerStyle={styles.content}
          footer={
            <PrimaryButton
              label={submitting ? 'Sending…' : 'Request diagnostics'}
              disabled={!canSubmit}
              onPress={() => {
                void onRequestDiagnostics();
              }}
            />
          }
        >
          <Surface elevated padded style={styles.card}>
            <AppText variant="label" color="primary">
              Computer diagnostics
            </AppText>
            <Row
              label="Vehicle"
              value={
                vehicle
                  ? `${vehicleTitle(vehicle)} · ${vehicle.year}`
                  : '—'
              }
            />
            <Divider />
            <Row label="Problem" value={problem?.title ?? '—'} />
            <Divider />
            <Row label="Location" value={draft.location?.label ?? '—'} />
            <Divider />
            <Row label="Service" value={option?.title ?? '—'} />
            <Divider />
            <Row
              label="Estimated price"
              value={option ? `From ${option.estimatedFrom.display}` : '—'}
            />
            {vehicle ? (
              <AppText variant="caption" color="textMuted">
                {vehicleSubtitle(vehicle)}
              </AppText>
            ) : null}
          </Surface>
          <AppText variant="caption" color="textMuted">
            Estimated price is mock catalog data, not a final charge.
          </AppText>
        </ServiceScreenScaffold>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    flexGrow: 0,
  },
  card: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xxs,
  },
});
