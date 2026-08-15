import { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { BatteryScreenHeader } from '@/features/services/battery/components/BatteryScreenHeader';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { MockMap } from '@/features/services/battery/components/MockMap';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { resolveCustomerLocation } from '@/features/services/battery/location';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function BatteryLocationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, setLocation } = useBatteryFlow();
  const location = draft.location;

  useEffect(() => {
    void resolveCustomerLocation().then(setLocation);
  }, [setLocation]);

  return (
    <View style={styles.screen}>
      <BatteryScreenHeader
        title="Where are you?"
        subtitle="We’ll send a specialist to this spot"
      />
      <FadeIn>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <MockMap location={location} />
          <View style={styles.place}>
            <AppText variant="label" color="primary">
              Current location
            </AppText>
            <AppText variant="h3">📍 {location.label}</AppText>
          </View>
          <AnimatedPressable
            accessibilityLabel="Change location"
            onPress={() => {
              Alert.alert(
                'Change location',
                'Live location picking will use expo-location in a later build.',
              );
            }}
            style={styles.change}
          >
            <AppText variant="button" color="primary">
              Change location
            </AppText>
          </AnimatedPressable>
          <PrimaryButton
            label="Confirm location"
            onPress={() => router.push('/battery/summary')}
          />
        </ScrollView>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  place: {
    gap: spacing.xs,
  },
  change: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
