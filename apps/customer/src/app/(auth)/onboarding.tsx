import { useCallback, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingSlide } from '@/components/auth/OnboardingSlide';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { getCopy } from '@/content/copy';
import { useSession } from '@/services/session/SessionProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { session, completeOnboarding } = useSession();
  const copy = getCopy(session.language);
  const slides = copy.onboarding.slides;
  const listRef = useRef<FlatList<(typeof slides)[number]>>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pagerWidth, setPagerWidth] = useState(windowWidth);

  const pageWidth = pagerWidth > 0 ? pagerWidth : windowWidth;
  const isLast = index >= slides.length - 1;

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
      const clamped = Math.max(0, Math.min(nextIndex, slides.length - 1));
      listRef.current?.scrollToIndex({
        index: clamped,
        animated: true,
      });
      setIndex(clamped);
    },
    [slides.length],
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
    // Do not pop into Home / boot. Stay on slide 1.
    return true;
  }, [goTo, index]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () =>
        goBack(),
      );
      return () => sub.remove();
    }, [goBack]),
  );

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pageWidth <= 0) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (next >= 0 && next < slides.length) {
      setIndex(next);
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) {
        setIndex(first.index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const getItemLayout = useCallback(
    (_: unknown, itemIndex: number) => ({
      length: pageWidth,
      offset: pageWidth * itemIndex,
      index: itemIndex,
    }),
    [pageWidth],
  );

  const listExtraData = useMemo(() => index, [index]);

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
          {slides.map((item, dotIndex) => (
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

      <FlatList
        ref={listRef}
        data={slides}
        extraData={listExtraData}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={({ index: failedIndex }) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: failedIndex,
              animated: true,
            });
          }, 50);
        }}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth > 0 && nextWidth !== pagerWidth) {
            setPagerWidth(nextWidth);
          }
        }}
        initialNumToRender={3}
        windowSize={3}
        removeClippedSubviews={false}
        style={styles.pager}
        renderItem={({ item, index: slideIndex }) => (
          <View style={{ width: pageWidth, flex: 1 }}>
            <View style={styles.pageInner}>
              <OnboardingSlide
                slide={item}
                index={slideIndex}
                active={slideIndex === index}
              />
            </View>
          </View>
        )}
      />

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
  pageInner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
});
