import { type ReactNode, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';

import { ServiceIcon } from '@/components/automotive/ServiceIcon';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { FormField } from '@/features/vehicles/components/FormField';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { StarRow } from '@/features/services/battery/components/StarRow';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { assignedMechanicIdentity } from '@/features/services/flow/requestFlow';
import { isApiError } from '@/lib/api/errors';
import { createRating, isDuplicateRatingError } from '@/lib/api/ratings';
import { runPreset } from '@/animations/transitions';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function Reveal({
  delayMs,
  children,
}: {
  delayMs: number;
  children: ReactNode;
}) {
  const reducedMotion = !!useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 16);

  useEffect(() => {
    runPreset('fadeInUp', { opacity, translateY }, { reducedMotion, delayMs });
  }, [delayMs, opacity, reducedMotion, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

function AspectRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <View style={styles.aspect}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <StarRow value={value} onChange={onChange} size="sm" align="end" />
    </View>
  );
}

export default function BatteryRatingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, setRating, reset } = useBatteryFlow();
  const [overall, setOverall] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [price, setPrice] = useState(0);
  const [quality, setQuality] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const mechanicName =
    assignedMechanicIdentity(draft.liveRequest)?.name ?? 'your specialist';

  if (submitted) {
    return (
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + spacing['2xl'] },
        ]}
      >
        <BatteryScreenScaffold
          contentContainerStyle={styles.successContent}
          footer={
            <PrimaryButton
              label="Back to Home"
              onPress={() => {
                reset();
                router.replace('/(app)/(tabs)');
              }}
            />
          }
        >
          <Reveal delayMs={0}>
            <View style={styles.successCopy}>
              <View style={styles.mark}>
                <ServiceIcon kind="mechanic" size={28} />
              </View>
              <AppText variant="label" color="success" style={styles.center}>
                Feedback received
              </AppText>
              <AppText variant="h2" style={styles.center}>
                Thank you!
              </AppText>
              <AppText variant="body" color="textSecondary" style={styles.center}>
                Your feedback helps us improve AutoHelp.
              </AppText>
            </View>
          </Reveal>
        </BatteryScreenScaffold>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + spacing['2xl'] },
      ]}
    >
      <BatteryScreenScaffold
        keyboard
        contentContainerStyle={styles.content}
        footer={
          <PrimaryButton
            label={busy ? 'Submitting…' : 'Submit rating'}
            disabled={overall === 0 || busy}
            onPress={() => {
              if (!draft.serviceRequestId || busy) {
                Alert.alert(
                  'Couldn’t submit rating',
                  'This request is missing. Go back to Home and try again.',
                );
                return;
              }
              setBusy(true);
              void (async () => {
                try {
                  await createRating({
                    request: draft.serviceRequestId!,
                    stars: overall,
                    feedback: comment,
                  });
                  setRating({
                    overall,
                    speed,
                    price,
                    quality,
                    comment,
                  });
                  setSubmitted(true);
                } catch (error) {
                  if (isDuplicateRatingError(error)) {
                    setSubmitted(true);
                    return;
                  }
                  Alert.alert(
                    'Couldn’t submit rating',
                    isApiError(error)
                      ? error.message
                      : 'Check your connection and try again.',
                  );
                } finally {
                  setBusy(false);
                }
              })();
            }}
          />
        }
      >
        <Reveal delayMs={0}>
          <View style={styles.hero}>
            <AppText variant="label" color="primary" style={styles.center}>
              Battery Assistance
            </AppText>
            <AppText variant="h2" style={styles.center}>
              How was your experience?
            </AppText>
            <AppText variant="caption" color="textMuted" style={styles.center}>
              How was {mechanicName}?
            </AppText>
          </View>
        </Reveal>

        <Reveal delayMs={timing.instant}>
          <StarRow value={overall} onChange={setOverall} />
        </Reveal>

        <Reveal delayMs={timing.normal}>
          <View style={styles.aspects}>
            <AspectRow label="Speed" value={speed} onChange={setSpeed} />
            <AspectRow label="Price" value={price} onChange={setPrice} />
            <AspectRow label="Quality" value={quality} onChange={setQuality} />
          </View>
        </Reveal>

        <Reveal delayMs={timing.slow}>
          <FormField
            label="Comment (optional)"
            value={comment}
            onChangeText={setComment}
            placeholder="Anything we should know…"
            multiline
            textAlignVertical="top"
            style={styles.comment}
          />
        </Reveal>
      </BatteryScreenScaffold>
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
  hero: {
    gap: spacing.xs,
    alignItems: 'center',
  },
  center: {
    textAlign: 'center',
  },
  aspects: {
    gap: spacing.md,
  },
  aspect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  comment: {
    minHeight: 96,
  },
  successContent: {
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  successCopy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
