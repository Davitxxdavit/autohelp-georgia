import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { SearchingVisual } from '@/features/services/battery/components/SearchingVisual';
import { useBatteryBottomPad } from '@/features/services/battery/components/BatteryScreenScaffold';
import { SEARCH_DELAY_MS } from '@/features/services/battery/mock';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function StatusDot({
  delay,
  reducedMotion,
}: {
  delay: number;
  reducedMotion: boolean;
}) {
  const opacity = useSharedValue(reducedMotion ? 0.4 : 0.22);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.4;
      return;
    }
    const ease = Easing.inOut(Easing.sin);
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: timing.slow, easing: ease }),
          withTiming(0.22, { duration: timing.slow, easing: ease }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [delay, opacity, reducedMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style]} />;
}

function StatusDots({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <View style={styles.dots} accessibilityElementsHidden>
      <StatusDot delay={0} reducedMotion={reducedMotion} />
      <StatusDot delay={timing.fast} reducedMotion={reducedMotion} />
      <StatusDot delay={timing.fast * 2} reducedMotion={reducedMotion} />
    </View>
  );
}

export default function BatterySearchingScreen() {
  const insets = useSafeAreaInsets();
  const bottomPad = useBatteryBottomPad();
  const router = useRouter();
  const reducedMotion = !!useReducedMotion();

  useEffect(() => {
    const id = setTimeout(() => {
      router.replace('/battery/found');
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + spacing['2xl'],
          paddingBottom: bottomPad,
        },
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Finding nearby help. Looking for an available specialist near you."
      accessibilityState={{ busy: true }}
    >
      <FadeIn>
        <View style={styles.inner}>
          <AppText variant="label" color="primary" style={styles.center}>
            Battery Assistance
          </AppText>
          <SearchingVisual />
          <View style={styles.copy}>
            <AppText variant="h2" style={styles.center}>
              Finding nearby help
            </AppText>
            <AppText variant="body" color="textSecondary" style={styles.center}>
              Looking for an available specialist near you
            </AppText>
            <StatusDots reducedMotion={reducedMotion} />
            <AppText variant="caption" color="textMuted" style={styles.center}>
              Usually takes less than a minute
            </AppText>
          </View>
        </View>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  copy: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
