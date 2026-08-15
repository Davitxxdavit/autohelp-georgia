import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

/** Comfort gap above the system inset — same token already used on these screens. */
export function useBatteryBottomPad(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + spacing.xl;
}

export function BatteryActionBar({ children }: { children: ReactNode }) {
  const bottomPad = useBatteryBottomPad();

  return (
    <View style={[styles.footer, { paddingBottom: bottomPad }]}>
      {children}
    </View>
  );
}

type BatteryScreenScaffoldProps = {
  children: ReactNode;
  footer?: ReactNode;
  keyboard?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Battery flow layout: scrollable body + pinned CTA above the system inset.
 * CTA is outside the ScrollView so it cannot sit under the Android nav bar.
 */
export function BatteryScreenScaffold({
  children,
  footer,
  keyboard = false,
  contentContainerStyle,
}: BatteryScreenScaffoldProps) {
  const bottomPad = useBatteryBottomPad();

  const main = (
    <View style={styles.main}>
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
      {footer ? <BatteryActionBar>{footer}</BatteryActionBar> : null}
    </View>
  );

  if (!keyboard) return main;

  return (
    <KeyboardAvoidingView
      style={styles.main}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {main}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
});
