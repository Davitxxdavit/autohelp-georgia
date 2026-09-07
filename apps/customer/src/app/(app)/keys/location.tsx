import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { FadeIn } from '@/features/services/flow/FadeIn';
import { LocationCaptureBlock } from '@/features/services/flow/LocationCaptureBlock';
import { isUsableDeviceLocation } from '@/features/services/flow/location';
import { ServiceScreenHeader } from '@/features/services/flow/ServiceScreenHeader';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import { useDeviceLocationCapture } from '@/features/services/flow/useDeviceLocationCapture';
import { useKeysFlow } from '@/features/services/keys/KeysFlowProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function KeysLocationScreen() {
  const router = useRouter();
  const { draft, setLocation } = useKeysFlow();
  const location = draft.location;
  const { phase, message, retry } = useDeviceLocationCapture(
    location,
    setLocation,
  );
  const canConfirm = isUsableDeviceLocation(location) && phase === 'ready';

  return (
    <View style={styles.screen}>
      <ServiceScreenHeader
        title="Where are you?"
        subtitle="We’ll send a locksmith to this spot"
      />
      <FadeIn>
        <ServiceScreenScaffold
          contentContainerStyle={styles.content}
          footer={
            <PrimaryButton
              label="Confirm location"
              disabled={!canConfirm}
              onPress={() => router.push('/keys/summary' as Href)}
            />
          }
        >
          <LocationCaptureBlock
            location={location}
            phase={phase}
            message={message}
            onRetry={retry}
          />
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
});
