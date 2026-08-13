import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Surface } from '@/components/ui/Surface';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

/**
 * MOCK confirmation — no mechanic was contacted.
 * Real matching / tracking comes in a later step.
 */
export default function RequestSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();

  return (
    <>
      <Stack.Screen options={{ title: 'შეკვეთა', headerBackVisible: false }} />
      <View
        style={[
          styles.screen,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Surface elevated padded radiusToken="xl" style={styles.card}>
          <StatusBadge label="Draft" tone="warning" />
          <CarSilhouette width={200} height={68} />
          <AppText variant="h2" style={styles.title}>
            შეკვეთა მზად არის
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.body}>
            შემდეგ ეტაპზე აქ დაიწყება სპეციალისტის ძებნა.
          </AppText>
          <AppText variant="caption" color="textMuted">
            ეს ლოკალური mock შეკვეთაა — მექანიკოსი რეალურად არ არის გამოძახებული.
          </AppText>
          {requestId ? (
            <AppText variant="caption" color="textMuted">
              ID: {requestId}
            </AppText>
          ) : null}
        </Surface>

        <PrimaryButton
          label="მთავარზე დაბრუნება"
          onPress={() => {
            router.replace('/(app)/(tabs)');
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing['2xl'],
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
  },
});
