import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { MechanicCard } from '@/features/services/flow/MechanicCard';
import { Reveal } from '@/features/services/flow/Reveal';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import { TrackingMap } from '@/features/services/flow/TrackingMap';
import { MOCK_SPECIALIST_POINT } from '@/features/services/flow/location';
import { useDiagnosticsFlow } from '@/features/services/diagnostics/DiagnosticsFlowProvider';
import { MOCK_SPECIALIST } from '@/features/services/diagnostics/mock';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function DiagnosticsTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, markCompleted } = useDiagnosticsFlow();
  const specialist = MOCK_SPECIALIST;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.lg },
      ]}
    >
      <ServiceScreenScaffold
        contentContainerStyle={styles.content}
        footer={
          <PrimaryButton
            label="Service completed"
            onPress={() => {
              markCompleted();
              router.replace('/diagnostics/completed' as Href);
            }}
          />
        }
      >
        <Reveal delayMs={0}>
          <View style={styles.heading}>
            <AppText variant="label" color="primary">
              Live tracking
            </AppText>
            <AppText variant="h3">Specialist on the way</AppText>
          </View>
        </Reveal>

        <Reveal delayMs={timing.instant}>
          <TrackingMap
            userPoint={draft.location.point}
            mechanicPoint={MOCK_SPECIALIST_POINT}
          />
        </Reveal>

        <Reveal delayMs={timing.normal}>
          <View style={styles.eta}>
            <AppText variant="caption" color="textMuted" style={styles.center}>
              Arriving in
            </AppText>
            <AppText variant="h2" style={styles.center}>
              ~{specialist.etaMinutes} min
            </AppText>
          </View>
        </Reveal>

        <Reveal delayMs={timing.slow}>
          <MechanicCard
            mechanic={specialist}
            footer={`${specialist.distanceKm} km`}
          />
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
    gap: spacing.md,
    flexGrow: 0,
  },
  heading: {
    gap: spacing.xxs,
  },
  eta: {
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
});
