import { useCallback, useRef, useState } from 'react';
import {
  BackHandler,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingSlide } from '@/components/auth/OnboardingSlide';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { copy } from '@/content/copy';
import { useSession } from '@/services/session/SessionProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

const SLIDES = copy.onboarding.slides;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { completeOnboarding } = useSession();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const isLast = index >= SLIDES.length - 1;

  const finish = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await completeOnboarding();
      router.replace('/(auth)/login');
    } finally {
      setBusy(false);
    }
  }, [busy, completeOnboarding, router]);

  const goTo = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(nextIndex, SLIDES.length - 1));
      scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
      setIndex(clamped);
    },
    [width],
  );

  const goNext = useCallback(() => {
    if (isLast) {
      void finish();
      return;
    }
    goTo(index + 1);
  }, [finish, goTo, index, isLast]);

  const goBack = useCallback(() => {
    if (index > 0) {
      goTo(index - 1);
      return true;
    }
    return false;
  }, [goTo, index]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () =>
        goBack(),
      );
      return () => sub.remove();
    }, [goBack]),
  );

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next >= 0 && next < SLIDES.length) {
      setIndex(next);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {SLIDES.map((item, dotIndex) => (
            <View
              key={item.id}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>
        <AnimatedPressable
          accessibilityLabel={copy.onboarding.skip}
          onPress={() => {
            void finish();
          }}
          style={styles.skip}
        >
          <AppText variant="bodyMedium" color="textSecondary">
            {copy.onboarding.skip}
          </AppText>
        </AnimatedPressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        style={styles.pager}
        contentContainerStyle={styles.pagerContent}
      >
        {SLIDES.map((slide, slideIndex) => (
          <View key={slide.id} style={[styles.page, { width }]}>
            <View style={styles.pageInner}>
              <OnboardingSlide slide={slide} index={slideIndex} />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={isLast ? copy.onboarding.start : copy.onboarding.next}
          onPress={goNext}
          disabled={busy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 22,
    backgroundColor: colors.primary,
  },
  skip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    flexGrow: 1,
  },
  page: {
    flexGrow: 1,
  },
  pageInner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
});
