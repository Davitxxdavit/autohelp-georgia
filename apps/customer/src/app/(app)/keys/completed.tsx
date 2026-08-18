import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ServiceIcon } from '@/components/automotive/ServiceIcon';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { Reveal } from '@/features/services/flow/Reveal';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import { useKeysFlow } from '@/features/services/keys/KeysFlowProvider';
import {
  getKeysProblem,
  MOCK_SPECIALIST,
  PRICE_CONFIRM_LATER,
} from '@/features/services/keys/mock';
import { vehicleTitle } from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function formatWhen(iso: string | null): string {
  if (!iso) return new Date().toLocaleString();
  return new Date(iso).toLocaleString();
}

export default function KeysCompletedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft } = useKeysFlow();
  const { getById } = useVehicles();
  const vehicle = draft.vehicleId ? getById(draft.vehicleId) : undefined;
  const problem = draft.problemId ? getKeysProblem(draft.problemId) : undefined;
  const specialist = MOCK_SPECIALIST;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing['2xl'] },
      ]}
    >
      <ServiceScreenScaffold
        contentContainerStyle={styles.content}
        footer={
          <PrimaryButton
            label="Rate specialist"
            onPress={() => router.push('/keys/rating' as Href)}
          />
        }
      >
        <Reveal delayMs={0}>
          <View style={styles.hero}>
            <View style={styles.mark}>
              <ServiceIcon kind="locksmith" size={28} />
            </View>
            <AppText variant="label" color="success" style={styles.center}>
              Service completed
            </AppText>
            <AppText variant="h2" style={styles.center}>
              Auto Key
            </AppText>
            {problem ? (
              <AppText variant="body" color="textSecondary" style={styles.center}>
                {problem.title}
              </AppText>
            ) : null}
          </View>
        </Reveal>

        <Reveal delayMs={timing.normal}>
          <View style={styles.details}>
            <Divider />

            {vehicle ? (
              <View style={styles.block}>
                <AppText variant="caption" color="textMuted">
                  Your vehicle
                </AppText>
                <AppText variant="bodyMedium">
                  {vehicleTitle(vehicle)} · {vehicle.year}
                </AppText>
              </View>
            ) : null}

            <View style={styles.block}>
              <AppText variant="caption" color="textMuted">
                Specialist
              </AppText>
              <AppText variant="bodyMedium">{specialist.name}</AppText>
            </View>

            <View style={styles.block}>
              <AppText variant="caption" color="textMuted">
                Price
              </AppText>
              <AppText variant="bodyMedium">{PRICE_CONFIRM_LATER}</AppText>
              <AppText variant="caption" color="textMuted">
                Confirmed by the specialist
              </AppText>
            </View>

            <View style={styles.block}>
              <AppText variant="caption" color="textMuted">
                Date / time
              </AppText>
              <AppText variant="bodyMedium">
                {formatWhen(draft.completedAt)}
              </AppText>
            </View>
          </View>
        </Reveal>
      </ServiceScreenScaffold>
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
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
  details: {
    gap: spacing.sm,
  },
  block: {
    gap: spacing.xxs,
    marginTop: spacing.sm,
  },
});
