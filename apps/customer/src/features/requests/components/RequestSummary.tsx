import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { Surface } from '@/components/ui/Surface';
import { spacing } from '@/theme/spacing';

export type RequestSummaryProps = {
  vehicleLabel: string;
  vehicleMeta: string;
  serviceLabel: string;
  problemLabel: string;
  locationLabel: string;
  estimatedPriceLabel: string;
};

function Row({ label, value, meta }: { label: string; value: string; meta?: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="bodyMedium">{value}</AppText>
      {meta ? (
        <AppText variant="caption" color="textSecondary">
          {meta}
        </AppText>
      ) : null}
    </View>
  );
}

export function RequestSummary({
  vehicleLabel,
  vehicleMeta,
  serviceLabel,
  problemLabel,
  locationLabel,
  estimatedPriceLabel,
}: RequestSummaryProps) {
  return (
    <Surface elevated padded radiusToken="lg" style={styles.card}>
      <AppText variant="h3">დახმარების შეკვეთა</AppText>
      <Divider />
      <Row label="მანქანა" value={vehicleLabel} meta={vehicleMeta} />
      <Divider />
      <Row label="სერვისი" value={serviceLabel} />
      <Divider />
      <Row label="პრობლემა" value={problemLabel} />
      <Divider />
      <Row label="მდებარეობა" value={locationLabel} />
      <Divider />
      <View style={styles.row}>
        <AppText variant="caption" color="textMuted">
          სავარაუდო ფასი
        </AppText>
        <AppText variant="h3" color="primary">
          {estimatedPriceLabel}
        </AppText>
        <AppText variant="caption" color="textMuted">
          საბოლოო ფასი არ არის — მხოლოდ სავარაუდო დიაპაზონი
        </AppText>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xxs,
  },
});
