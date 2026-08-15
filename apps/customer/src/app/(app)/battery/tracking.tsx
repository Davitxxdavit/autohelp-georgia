import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { MechanicCard } from '@/features/services/battery/components/MechanicCard';
import { TrackingMap } from '@/features/services/battery/components/TrackingMap';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { MOCK_MECHANIC, MOCK_MECHANIC_POINT } from '@/features/services/battery/mock';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BatteryTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, markCompleted } = useBatteryFlow();
  const mechanic = MOCK_MECHANIC;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.lg },
      ]}
    >
      <FadeIn>
        <BatteryScreenScaffold
          contentContainerStyle={styles.content}
          footer={
            <PrimaryButton
              label="Service completed"
              onPress={() => {
                markCompleted();
                router.replace('/battery/completed');
              }}
            />
          }
        >
          <AppText variant="label" color="primary">
            Live tracking
          </AppText>
          <AppText variant="h3">Specialist on the way</AppText>
          <TrackingMap
            userPoint={draft.location.point}
            mechanicPoint={MOCK_MECHANIC_POINT}
          />
          <MechanicCard
            mechanic={mechanic}
            etaLabel={`Arriving in ${mechanic.etaMinutes} min`}
          />
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
    gap: spacing.md,
    flexGrow: 0,
  },
});
