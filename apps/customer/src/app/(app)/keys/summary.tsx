import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { Surface } from '@/components/ui/Surface';
import { FadeIn } from '@/features/services/flow/FadeIn';
import { ServiceScreenHeader } from '@/features/services/flow/ServiceScreenHeader';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import { useKeysFlow } from '@/features/services/keys/KeysFlowProvider';
import {
  getKeysProblem,
  PRICE_CONFIRM_LATER,
} from '@/features/services/keys/mock';
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

export default function KeysSummaryScreen() {
  const router = useRouter();
  const { draft, markRequested } = useKeysFlow();
  const { getById } = useVehicles();
  const vehicle = draft.vehicleId ? getById(draft.vehicleId) : undefined;
  const problem = draft.problemId ? getKeysProblem(draft.problemId) : undefined;

  const canSubmit = Boolean(vehicle && problem);

  return (
    <View style={styles.screen}>
      <ServiceScreenHeader
        title="Request summary"
        subtitle="Review before we look for a locksmith"
      />
      <FadeIn>
        <ServiceScreenScaffold
          contentContainerStyle={styles.content}
          footer={
            <PrimaryButton
              label="Request assistance"
              disabled={!canSubmit}
              onPress={() => {
                if (!canSubmit) return;
                markRequested();
                router.push('/keys/searching' as Href);
              }}
            />
          }
        >
          <Surface elevated padded style={styles.card}>
            <AppText variant="label" color="primary">
              Auto Key
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
            <Row label="Price" value={PRICE_CONFIRM_LATER} />
            {vehicle ? (
              <AppText variant="caption" color="textMuted">
                {vehicleSubtitle(vehicle)}
              </AppText>
            ) : null}
          </Surface>
          <AppText variant="caption" color="textMuted">
            A locksmith will confirm the price after seeing the job.
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
