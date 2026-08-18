import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';

import { ActiveOrderEmpty } from '@/components/home/ActiveOrderEmpty';
import { EmergencyHero } from '@/components/home/EmergencyHero';
import { HomeHeader } from '@/components/home/HomeHeader';
import { InspectionPromo } from '@/components/home/InspectionPromo';
import { ServicesSection } from '@/components/home/ServicesSection';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing['2xl'],
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <HomeHeader
        onLocationPress={() => {
          Alert.alert('ბათუმი', 'მდებარეობის არჩევა მალე დაემატება.');
        }}
      />

      <EmergencyHero
        onPressCta={() => {
          router.push('/battery' as Href);
        }}
      />

      <ServicesSection />

      <InspectionPromo
        onPress={() => {
          router.push('/inspection');
        }}
      />

      <ActiveOrderEmpty />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing['2xl'],
  },
});
