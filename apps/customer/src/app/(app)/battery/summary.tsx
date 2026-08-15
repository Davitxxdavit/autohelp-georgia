import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { Surface } from '@/components/ui/Surface';
import { BatteryScreenHeader } from '@/features/services/battery/components/BatteryScreenHeader';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import {
  getBatteryOption,
  getBatteryProblem,
} from '@/features/services/battery/mock';
import { vehicleSubtitle, vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, markRequested } = useBatteryFlow();
  const { getById } = useVehicles();
  const vehicle = draft.vehicleId ? getById(draft.vehicleId) : undefined;
  const option = draft.optionId ? getBatteryOption(draft.optionId) : undefined;
  const problem = draft.problemId
    ? getBatteryProblem(draft.problemId)
    : undefined;

  const canSubmit = Boolean(vehicle && option && problem);

  return (
    <View style={styles.screen}>
      <BatteryScreenHeader
        title="Request summary"
        subtitle="Review before we look for a specialist"
      />
      <FadeIn>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
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
          <PrimaryButton
            label="Request assistance"
            disabled={!canSubmit}
            onPress={() => {
              if (!canSubmit) return;
              markRequested();
              router.push('/battery/searching');
            }}
          />
        </ScrollView>
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
  },
  card: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xxs,
  },
});
