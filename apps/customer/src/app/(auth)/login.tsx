import { useCallback, useState } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PhoneInput, isValidGeMobile } from '@/components/auth/PhoneInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { getCopy } from '@/content/copy';
import { useSession } from '@/services/session/SessionProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, resetAppStateForDev } = useSession();
  const copy = getCopy(session.language);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const onContinue = () => {
    if (!isValidGeMobile(phone)) {
      setError(copy.login.invalidPhone);
      return;
    }
    setError(null);
    // MOCK — no SMS is sent. Navigate to OTP UI only.
    router.push({
      pathname: '/(auth)/verify-otp',
      params: { phone },
    });
  };

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
        <Pressable
          onLongPress={
            __DEV__
              ? () => {
                  void (async () => {
                    await resetAppStateForDev();
                    Alert.alert(
                      'DEV reset',
                      'Cleared language, onboarding, and mock auth.',
                    );
                  })();
                }
              : undefined
          }
          delayLongPress={600}
          accessibilityRole="text"
        >
          <AppText variant="label" color="primary">
            AutoHelp
          </AppText>
        </Pressable>
        <AppText variant="h2">{copy.login.title}</AppText>
        <AppText variant="body" color="textSecondary">
          {copy.login.subtitle}
        </AppText>
      </View>

      <View style={styles.form}>
        <PhoneInput
          countryCode={copy.login.countryCode}
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            if (error) setError(null);
          }}
          placeholder={copy.login.phonePlaceholder}
        />
        {error ? (
          <AppText variant="caption" color="danger">
            {error}
          </AppText>
        ) : null}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label={copy.login.continue} onPress={onContinue} />
        <AppText variant="caption" color="textMuted" style={styles.legal}>
          {copy.login.legal}
        </AppText>
        <View style={styles.links}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={copy.login.terms}
            onPress={() => Alert.alert(copy.login.terms, 'Placeholder — coming soon.')}
          >
            <AppText variant="caption" color="primary">
              {copy.login.terms}
            </AppText>
          </Pressable>
          <AppText variant="caption" color="textMuted">
            ·
          </AppText>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={copy.login.privacy}
            onPress={() =>
              Alert.alert(copy.login.privacy, 'Placeholder — coming soon.')
            }
          >
            <AppText variant="caption" color="primary">
              {copy.login.privacy}
            </AppText>
          </Pressable>
        </View>
      </View>
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
    gap: spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    gap: spacing.md,
  },
  legal: {
    textAlign: 'center',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
});
