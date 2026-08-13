import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MOCK_OTP_CODE, OtpInput } from '@/components/auth/OtpInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { formatDisplayPhone } from '@/components/auth/PhoneInput';
import { copy } from '@/content/copy';
import { useSession } from '@/services/session/SessionProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const RESEND_SECONDS = 42;

function formatCountdown(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function VerifyOtpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mockSignIn } = useSession();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = typeof params.phone === 'string' ? params.phone : '';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const verify = useCallback(async () => {
    if (busy) return;

    /**
     * MOCK AUTH ONLY
     * Accepts fixed OTP `123456`. Replace this block with real SMS verification.
     * No SMS is sent in this build.
     */
    if (code !== MOCK_OTP_CODE) {
      setError(copy.otp.invalid);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await mockSignIn(phone);
      router.replace('/(app)/(tabs)');
    } finally {
      setBusy(false);
    }
  }, [busy, code, mockSignIn, phone, router]);

  useEffect(() => {
    if (code.length !== 6 || busy) return;
    void verify();
    // Auto-submit once when the 6th digit is entered
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: trigger on code length only
  }, [code]);

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
      <View style={styles.header}>
        <AppText variant="h2">{copy.otp.title}</AppText>
        <AppText variant="body" color="textSecondary">
          {copy.otp.subtitle}
        </AppText>
        <AppText variant="bodyMedium">
          {formatDisplayPhone(phone, copy.login.countryCode)}
        </AppText>
        {__DEV__ ? (
          <AppText variant="caption" color="warning">
            {copy.otp.mockHint}
          </AppText>
        ) : null}
      </View>

      <View style={styles.form}>
        <OtpInput
          value={code}
          onChange={(value) => {
            setCode(value);
            if (error) setError(null);
          }}
        />
        {error ? (
          <AppText variant="caption" color="danger">
            {error}
          </AppText>
        ) : null}

        {secondsLeft > 0 ? (
          <AppText variant="caption" color="textMuted" style={styles.resend}>
            {copy.otp.resend} · {formatCountdown(secondsLeft)}
          </AppText>
        ) : (
          <AnimatedPressable
            accessibilityLabel={copy.otp.resend}
            onPress={() => {
              // MOCK — no SMS resent; reset countdown only
              setSecondsLeft(RESEND_SECONDS);
              setCode('');
              setError(null);
            }}
            style={styles.resendButton}
          >
            <AppText variant="bodyMedium" color="primary">
              {copy.otp.resend}
            </AppText>
          </AnimatedPressable>
        )}
      </View>

      <PrimaryButton
        label={copy.otp.verify}
        onPress={() => {
          void verify();
        }}
        disabled={busy || code.length < 6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  resend: {
    textAlign: 'center',
  },
  resendButton: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
});
