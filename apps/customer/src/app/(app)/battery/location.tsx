import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { BatteryScreenHeader } from '@/features/services/battery/components/BatteryScreenHeader';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { LocationCaptureBlock } from '@/features/services/flow/LocationCaptureBlock';
import { isUsableDeviceLocation } from '@/features/services/flow/location';
import { useDeviceLocationCapture } from '@/features/services/flow/useDeviceLocationCapture';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BatteryLocationScreen() {
  const router = useRouter();
  const { draft, setLocation } = useBatteryFlow();
  const location = draft.location;
  const { phase, message, retry } = useDeviceLocationCapture(
    location,
    setLocation,
  );
  const canConfirm = isUsableDeviceLocation(location) && phase === 'ready';

  return (
    <View style={styles.screen}>
      <BatteryScreenHeader
        title="Where are you?"
        subtitle="We’ll send a specialist to this spot"
      />
      <FadeIn>
        <BatteryScreenScaffold
          contentContainerStyle={styles.content}
          footer={
            <PrimaryButton
              label="Confirm location"
              disabled={!canConfirm}
              onPress={() => router.push('/battery/summary')}
            />
          }
        >
          <LocationCaptureBlock
            location={location}
            phase={phase}
            message={message}
            onRetry={retry}
          />
        </BatteryScreenScaffold>
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
});
