import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { Surface } from '@/components/ui/Surface';
import {
  formatGel,
  pricingTotalLabel,
  type ServicePricing,
} from '@/features/requests/questions';
import { spacing } from '@/theme/spacing';

export type RequestSummaryProps = {
  headline: string;
  vehicleLabel: string;
  vehicleMeta: string;
  locationLabel: string;
  pricing: ServicePricing;
};

function MoneyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.moneyRow}>
      <AppText variant="body" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="bodyMedium">{value}</AppText>
    </View>
  );
}

export function RequestSummary({
  headline,
  vehicleLabel,
  vehicleMeta,
  locationLabel,
  pricing,
}: RequestSummaryProps) {
  return (
    <Surface elevated padded radiusToken="lg" style={styles.card}>
      <AppText variant="h3">{headline}</AppText>
      <AppText variant="body" color="textSecondary">
        {vehicleLabel}
        {vehicleMeta ? ` · ${vehicleMeta}` : ''}
      </AppText>
      <AppText variant="body" color="textSecondary">
        📍 {locationLabel}
      </AppText>

      <Divider />

      {pricing.kind === 'fixed' ? (
        <View style={styles.pricing}>
          <MoneyRow
            label={pricing.serviceLine}
            value={formatGel(pricing.serviceAmount)}
          />
          <MoneyRow
            label={pricing.callOutLine}
            value={formatGel(pricing.callOutAmount)}
          />
          <Divider />
          <View style={styles.moneyRow}>
            <AppText variant="bodyMedium">Total</AppText>
            <AppText variant="h3" color="primary">
              {pricingTotalLabel(pricing)}
            </AppText>
          </View>
        </View>
      ) : (
        <View style={styles.confirmLater}>
          <AppText variant="bodyMedium" color="primary">
            {pricing.message}
          </AppText>
          <AppText variant="caption" color="textMuted">
            Auto key pricing depends on the situation on site.
          </AppText>
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  pricing: {
    gap: spacing.sm,
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  confirmLater: {
    gap: spacing.xs,
  },
});
