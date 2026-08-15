import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { SearchingVisual } from '@/features/services/battery/components/SearchingVisual';
import { SEARCH_DELAY_MS } from '@/features/services/battery/mock';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BatterySearchingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
          paddingBottom: insets.bottom + spacing.xl,
        },
      ]}
    >
      <FadeIn>
        <View style={styles.inner}>
          <SearchingVisual />
          <AppText variant="h2" style={styles.title}>
            Finding a specialist nearby...
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.copy}>
            Matching a verified AutoHelp specialist in Batumi.
          </AppText>
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
  title: {
    textAlign: 'center',
  },
  copy: {
    textAlign: 'center',
  },
});
