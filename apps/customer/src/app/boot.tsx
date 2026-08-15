import { useCallback } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { colors } from '@/theme/colors';

/**
 * Holding route so `/` (Home tabs) is not the first mounted screen.
 * AuthRedirect is the only navigator after launch + session are ready.
 */
export default function BootScreen() {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  return <View style={styles.hold} />;
}

const styles = StyleSheet.create({
  hold: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
