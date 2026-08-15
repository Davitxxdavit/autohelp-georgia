import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { FormField } from '@/features/vehicles/components/FormField';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { StarRow } from '@/features/services/battery/components/StarRow';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BatteryRatingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setRating, reset } = useBatteryFlow();
  const [overall, setOverall] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [price, setPrice] = useState(0);
  const [quality, setQuality] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
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
          <View style={styles.success}>
            <AppText variant="h2" style={styles.center}>
              Thank you!
            </AppText>
            <AppText variant="body" color="textSecondary" style={styles.center}>
              Your feedback helps us improve AutoHelp.
            </AppText>
            <View style={styles.footer}>
              <PrimaryButton
                label="Back to Home"
                onPress={() => {
                  reset();
                  router.replace('/(app)/(tabs)');
                }}
              />
            </View>
          </View>
        </FadeIn>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing['2xl'],
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="h2">How was your experience?</AppText>
        <StarRow value={overall} onChange={setOverall} />

        <View style={styles.aspect}>
          <AppText variant="caption" color="textMuted">
            Speed
          </AppText>
          <StarRow value={speed} onChange={setSpeed} size="sm" />
        </View>
        <View style={styles.aspect}>
          <AppText variant="caption" color="textMuted">
            Price
          </AppText>
          <StarRow value={price} onChange={setPrice} size="sm" />
        </View>
        <View style={styles.aspect}>
          <AppText variant="caption" color="textMuted">
            Quality
          </AppText>
          <StarRow value={quality} onChange={setQuality} size="sm" />
        </View>

        <FormField
          label="Comment (optional)"
          value={comment}
          onChangeText={setComment}
          placeholder="Anything we should know…"
          multiline
          textAlignVertical="top"
          style={styles.comment}
        />

        <PrimaryButton
          label="Submit rating"
          disabled={overall === 0}
          onPress={() => {
            setRating({
              overall,
              speed,
              price,
              quality,
              comment,
            });
            setSubmitted(true);
          }}
        />
      </ScrollView>
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
  aspect: {
    gap: spacing.xs,
    alignItems: 'center',
  },
  comment: {
    minHeight: 96,
  },
  success: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  center: {
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
  },
});
