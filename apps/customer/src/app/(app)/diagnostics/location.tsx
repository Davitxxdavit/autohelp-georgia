import { useEffect } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { FadeIn } from '@/features/services/flow/FadeIn';
import { MockMap } from '@/features/services/flow/MockMap';
import { resolveCustomerLocation } from '@/features/services/flow/location';
import { ServiceScreenHeader } from '@/features/services/flow/ServiceScreenHeader';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import { useDiagnosticsFlow } from '@/features/services/diagnostics/DiagnosticsFlowProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function DiagnosticsLocationScreen() {
  const router = useRouter();
  const { draft, setLocation } = useDiagnosticsFlow();
  const location = draft.location;

  useEffect(() => {
    void resolveCustomerLocation().then(setLocation);
  }, [setLocation]);

  return (
    <View style={styles.screen}>
      <ServiceScreenHeader
        title="Where are you?"
        subtitle="We’ll send a specialist to this spot"
      />
      <FadeIn>
        <ServiceScreenScaffold
          contentContainerStyle={styles.content}
          footer={
            <PrimaryButton
              label="Confirm location"
              onPress={() => router.push('/diagnostics/summary' as Href)}
            />
          }
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
        </ServiceScreenScaffold>
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
    flexGrow: 0,
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
