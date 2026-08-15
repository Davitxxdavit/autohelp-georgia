import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { Surface } from '@/components/ui/Surface';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { getBatteryOption } from '@/features/services/battery/mock';
import { vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

function formatWhen(iso: string | null): string {
  if (!iso) return new Date().toLocaleString();
  return new Date(iso).toLocaleString();
}

export default function BatteryCompletedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft } = useBatteryFlow();
  const { getById } = useVehicles();
  const vehicle = draft.vehicleId ? getById(draft.vehicleId) : undefined;
  const option = draft.optionId ? getBatteryOption(draft.optionId) : undefined;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing['2xl'] },
      ]}
    >
      <FadeIn>
        <BatteryScreenScaffold
          contentContainerStyle={styles.content}
          footer={
            <PrimaryButton
              label="Rate specialist"
              onPress={() => router.push('/battery/rating')}
            />
          }
        >
          <AppText variant="label" color="success">
            Service completed
          </AppText>
          <AppText variant="h2">
            {vehicle ? vehicleTitle(vehicle) : 'Vehicle'}
          </AppText>
          <AppText variant="body" color="textSecondary">
            Battery Assistance
          </AppText>
          <Surface elevated padded style={styles.card}>
            <AppText variant="caption" color="textMuted">
              Service
            </AppText>
            <AppText variant="bodyMedium">{option?.title ?? '—'}</AppText>
            <Divider />
            <AppText variant="caption" color="textMuted">
              Price
            </AppText>
            <AppText variant="bodyMedium">
              {option ? `${option.estimatedFrom.display}` : '—'}
            </AppText>
            <Divider />
            <AppText variant="caption" color="textMuted">
              Date / time
            </AppText>
            <AppText variant="bodyMedium">
              {formatWhen(draft.completedAt)}
            </AppText>
          </Surface>
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
    gap: spacing.sm,
    flexGrow: 0,
  },
  card: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
});
