import { useCallback, useState } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageCard } from '@/components/auth/LanguageCard';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  type LanguageId,
} from '@/constants/languages';
import { getCopy } from '@/content/copy';
import { useSession } from '@/services/session/SessionProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, setLanguage, resetAppStateForDev } = useSession();
  const [selected, setSelected] = useState<LanguageId>(
    session.language ?? DEFAULT_LANGUAGE,
  );
  const [saving, setSaving] = useState(false);
  const copy = getCopy(selected);

  // Prevent Android back from leaving first-launch into an invalid route
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const onContinue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setLanguage(selected);
      // Always onboarding next — do not let leftover auth flags skip to Home.
      router.replace('/(auth)/onboarding');
    } finally {
      setSaving(false);
    }
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
        {/* DEV: long-press brand to reset first-launch / mock auth state */}
        <Pressable
          onLongPress={
            __DEV__
              ? () => {
                  void (async () => {
                    await resetAppStateForDev();
                    setSelected(DEFAULT_LANGUAGE);
                    Alert.alert(
                      'DEV reset',
                      'Cleared language, onboarding, and mock auth. Reload if the flow does not restart.',
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
        <AppText variant="h1">{copy.language.title}</AppText>
      </View>

      <View style={styles.list}>
        {LANGUAGES.map((language) => (
          <LanguageCard
            key={language.id}
            language={language}
            selected={selected === language.id}
            onSelect={() => setSelected(language.id)}
          />
        ))}
      </View>

      <PrimaryButton
        label={copy.language.continue}
        onPress={onContinue}
        disabled={saving}
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
  list: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
});
