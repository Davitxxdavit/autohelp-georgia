import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Surface } from '@/components/ui/Surface';
import type { ApiServiceRequest } from '@/lib/api/types';
import {
  formatRequestPrice,
  formatRequestTime,
  requestStatusLabel,
  requestStatusTone,
  serviceCodeLabel,
} from '@/lib/api/status';
import { spacing } from '@/theme/spacing';

type OrderCardProps = {
  request: ApiServiceRequest;
};

export function OrderCard({ request }: OrderCardProps) {
  const router = useRouter();
  const vehicle = request.vehicle;
  const vehicleLabel = vehicle
    ? `${vehicle.make} ${vehicle.model} · ${vehicle.year}`
    : '—';
  const address = request.customer_address?.trim() || '—';
  const mechanicName = request.assigned_mechanic?.first_name?.trim();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${serviceCodeLabel(request.service_code)} ${requestStatusLabel(request.status)}`}
      onPress={() => router.push(`/order/${request.id}` as Href)}
    >
    <Surface elevated padded style={styles.card}>
      <View style={styles.top}>
        <AppText variant="bodyMedium" style={styles.service}>
          {serviceCodeLabel(request.service_code)}
        </AppText>
        <StatusBadge
          label={requestStatusLabel(request.status)}
          tone={requestStatusTone(request.status)}
        />
      </View>
      <Divider />
      <AppText variant="caption" color="textMuted">
        {vehicleLabel}
      </AppText>
      <AppText variant="caption" color="textSecondary">
        {address}
      </AppText>
      {mechanicName ? (
        <AppText variant="caption" color="textSecondary">
          {mechanicName}
        </AppText>
      ) : null}
      <AppText variant="bodyMedium">
        {formatRequestPrice(request)}
      </AppText>
      <AppText variant="caption" color="textMuted">
        {formatRequestTime(request.created_at)}
      </AppText>
    </Surface>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  service: {
    flex: 1,
  },
});
