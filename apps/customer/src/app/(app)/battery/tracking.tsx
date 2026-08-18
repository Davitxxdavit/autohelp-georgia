import { type ReactNode, useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { MechanicCard } from '@/features/services/battery/components/MechanicCard';
import { TrackingMap } from '@/features/services/battery/components/TrackingMap';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { MOCK_MECHANIC, MOCK_MECHANIC_POINT } from '@/features/services/battery/mock';
import { runPreset } from '@/animations/transitions';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function Reveal({
  delayMs,
  children,
}: {
  delayMs: number;
  children: ReactNode;
}) {
  const reducedMotion = !!useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 16);

  useEffect(() => {
    runPreset('fadeInUp', { opacity, translateY }, { reducedMotion, delayMs });
  }, [delayMs, opacity, reducedMotion, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

export default function BatteryTrackingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, markCompleted } = useBatteryFlow();
  const mechanic = MOCK_MECHANIC;

  const onContact = () => {
    Alert.alert(
      'Contact specialist',
      'Calling will be available in a later build.',
    );
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.lg },
      ]}
    >
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
        <Reveal delayMs={0}>
          <View style={styles.heading}>
            <AppText variant="label" color="primary">
              Battery Assistance
            </AppText>
            <StatusBadge label="On the way" tone="primary" />
          </View>
        </Reveal>

        <Reveal delayMs={timing.instant}>
          <View style={styles.eta}>
            <AppText variant="caption" color="textMuted" style={styles.center}>
              Arriving in
            </AppText>
            <AppText variant="h2" style={styles.center}>
              ~{mechanic.etaMinutes} min
            </AppText>
          </View>
        </Reveal>

        <Reveal delayMs={timing.normal}>
          <TrackingMap
            userPoint={draft.location.point}
            mechanicPoint={MOCK_MECHANIC_POINT}
          />
        </Reveal>

        <Reveal delayMs={timing.slow}>
          <View style={styles.specialist}>
            <MechanicCard
              mechanic={mechanic}
              footer={`${mechanic.distanceKm} km`}
            />
            <AnimatedPressable
              accessibilityLabel="Contact specialist"
              onPress={onContact}
              style={styles.contact}
            >
              <AppText variant="button" color="primary">
                Contact specialist
              </AppText>
            </AnimatedPressable>
          </View>
        </Reveal>
      </BatteryScreenScaffold>
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
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  eta: {
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
  specialist: {
    gap: spacing.sm,
  },
  contact: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
