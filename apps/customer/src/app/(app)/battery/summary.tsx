import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { Surface } from '@/components/ui/Surface';
import { BatteryScreenHeader } from '@/features/services/battery/components/BatteryScreenHeader';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import {
  getBatteryOption,
  getBatteryProblem,
} from '@/features/services/battery/mock';
import { vehicleSubtitle, vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { createServiceRequest } from '@/lib/api/requests';
import { resolveBatteryProblemCode, resolveCatalogIds } from '@/lib/api/mapping';
import { isApiError } from '@/lib/api/errors';
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

export default function BatterySummaryScreen() {
  const router = useRouter();
  const { draft, markRequested } = useBatteryFlow();
  const { getById } = useVehicles();
  const vehicle = draft.vehicleId ? getById(draft.vehicleId) : undefined;
  const option = draft.optionId ? getBatteryOption(draft.optionId) : undefined;
  const problem = draft.problemId
    ? getBatteryProblem(draft.problemId)
    : undefined;
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = Boolean(vehicle && option && problem) && !submitting;

  const onRequestAssistance = async () => {
    if (!vehicle || !option || !problem || !draft.problemId || submitting) return;
    setSubmitting(true);
    try {
      const { service, problem: apiProblem } = await resolveCatalogIds({
        frontendServiceId: 'battery',
        problemCode: resolveBatteryProblemCode(draft.problemId, draft.optionId),
      });

      const created = await createServiceRequest({
        vehicle: vehicle.id,
        service: service.id,
        problem: apiProblem.id,
        customer_latitude: draft.location.point.latitude,
        customer_longitude: draft.location.point.longitude,
        customer_address: draft.location.label,
      });

      markRequested({
        id: created.id,
        estimatedPriceAmount: created.estimated_price_amount,
        estimatedPriceCurrency: created.estimated_price_currency,
      });
      router.push('/battery/searching');
    } catch (error) {
      if (__DEV__) {
        console.warn('[AutoHelp] Battery request create failed', error);
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
      <BatteryScreenHeader
        title="Request summary"
        subtitle="Review before we look for a specialist"
      />
      <FadeIn>
        <BatteryScreenScaffold
          contentContainerStyle={styles.content}
          footer={
            <PrimaryButton
              label={submitting ? 'Sending…' : 'Request assistance'}
              disabled={!canSubmit}
              onPress={() => {
                void onRequestAssistance();
              }}
            />
          }
        >
          <Surface elevated padded style={styles.card}>
            <AppText variant="label" color="primary">
              Battery Assistance
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
            <Row label="Location" value={draft.location.label} />
            <Divider />
            <Row label="Service" value={option?.title ?? '—'} />
            <Divider />
            <Row
              label="Estimated price"
              value={
                option
                  ? `${option.estimatedFrom.display}${option.estimatedNote ? ` ${option.estimatedNote}` : ''}`
                  : '—'
              }
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
        </BatteryScreenScaffold>
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
