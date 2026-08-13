import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function OrdersScreen() {
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
      <AppText variant="h2">შეკვეთები</AppText>
      <AppText variant="body" color="textSecondary">
        აქ გამოჩნდება შენი შეკვეთების ისტორია.
      </AppText>

      <GradientSurface
        colors={[colors.surfaceElevated, colors.background]}
        radiusToken="xl"
        style={styles.empty}
      >
        <CarSilhouette width={180} height={60} color={colors.textMuted} />
        <AppText variant="h3" style={styles.emptyTitle}>
          ჯერ შეკვეთები არ გაქვს
        </AppText>
        <AppText variant="body" color="textSecondary" style={styles.emptyCopy}>
          დახმარების გამოძახების შემდეგ შენი შეკვეთები და სტატუსები აქ
          გამოჩნდება.
        </AppText>
        <PrimaryButton
          label="მთავარზე გადასვლა"
          onPress={() => router.push('/(app)/(tabs)')}
        />
      </GradientSurface>
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
  empty: {
    marginTop: spacing.lg,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyCopy: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
