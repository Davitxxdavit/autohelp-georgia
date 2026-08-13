import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Surface } from '@/components/ui/Surface';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function InspectionPlaceholderScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <Surface elevated padded style={styles.card}>
        <StatusBadge label="Coming soon" tone="warning" />
        <AppText variant="h3" style={styles.title}>
          მანქანის ინსპექცია
        </AppText>
        <AppText variant="body" color="textSecondary">
          ყიდვამდე შემოწმების სრული ნაკადი მალე დაემატება. ამ ეტაპზე ეს მხოლოდ
          პრომო გვერდია.
        </AppText>
        <View style={styles.visual}>
          <CarSilhouette width={220} height={72} />
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  card: {
    gap: spacing.sm,
  },
  title: {
    marginTop: spacing.xs,
  },
  visual: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
});
