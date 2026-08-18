import { type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

/**
 * Job screens: scroll body + pinned CTA above the live system inset.
 */
export function JobScreenScaffold({
  children,
  footer,
  onBack,
  contentContainerStyle,
}: {
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomPad = insets.bottom + spacing.xl;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing.sm },
      ]}
    >
      <View style={styles.header}>
        <AnimatedPressable
          accessibilityLabel="Back"
          onPress={onBack ?? (() => router.back())}
          style={styles.back}
        >
          <AppText variant="button" color="primary">
            Back
          </AppText>
        </AnimatedPressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          contentContainerStyle,
          footer ? null : { paddingBottom: bottomPad },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { paddingBottom: bottomPad }]}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
});
