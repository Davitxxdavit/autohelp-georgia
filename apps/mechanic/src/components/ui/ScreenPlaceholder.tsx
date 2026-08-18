import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function ScreenPlaceholder({
  title,
  body,
  back,
}: {
  title: string;
  body: string;
  back?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      {back ? (
        <AnimatedPressable
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <AppText variant="button" color="primary">
            Back
          </AppText>
        </AnimatedPressable>
      ) : null}
      <AppText variant="h2">{title}</AppText>
      <AppText variant="body" color="textSecondary">
        {body}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
