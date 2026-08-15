import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Surface } from '@/components/ui/Surface';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { MechanicCard } from '@/features/services/battery/components/MechanicCard';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { getBatteryOption, MOCK_MECHANIC } from '@/features/services/battery/mock';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BatteryFoundScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, reset } = useBatteryFlow();
  const option = draft.optionId ? getBatteryOption(draft.optionId) : undefined;
  const mechanic = MOCK_MECHANIC;

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
            <>
              <PrimaryButton
                label="Track specialist"
                onPress={() => router.replace('/battery/tracking')}
              />
              <AnimatedPressable
                accessibilityLabel="Cancel request"
                onPress={() => {
                  Alert.alert(
                    'Cancel request?',
                    'This mock request will be closed.',
                    [
                      { text: 'Keep', style: 'cancel' },
                      {
                        text: 'Cancel request',
                        style: 'destructive',
                        onPress: () => {
                          reset();
                          router.replace('/(app)/(tabs)');
                        },
                      },
                    ],
                  );
                }}
                style={styles.cancel}
              >
                <AppText variant="button" color="danger">
                  Cancel request
                </AppText>
              </AnimatedPressable>
            </>
          }
        >
          <AppText variant="label" color="primary">
            Mechanic found
          </AppText>
          <AppText variant="h2">👨‍🔧 {mechanic.name}</AppText>
          <MechanicCard
            mechanic={mechanic}
            footer={`${mechanic.distanceKm} km away`}
            etaLabel={`ETA ~${mechanic.etaMinutes} min`}
          />
          <Surface elevated padded style={styles.meta}>
            <AppText variant="caption" color="textMuted">
              Service
            </AppText>
            <AppText variant="bodyMedium">Battery assistance</AppText>
            <AppText variant="caption" color="textMuted" style={styles.mt}>
              Price
            </AppText>
            <AppText variant="bodyMedium">
              {option
                ? `${option.estimatedFrom.display} estimated`
                : '—'}
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
    gap: spacing.md,
    flexGrow: 0,
  },
  meta: {
    gap: spacing.xxs,
  },
  mt: {
    marginTop: spacing.sm,
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
});
