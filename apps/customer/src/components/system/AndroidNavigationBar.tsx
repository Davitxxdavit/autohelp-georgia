import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  NavigationBar,
  setStyle,
  setVisibilityAsync,
} from 'expo-navigation-bar';

import { colors } from '@/theme/colors';

/**
 * Align Android system navigation bar with AutoHelp dark theme.
 */
export function AndroidNavigationBar() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    try {
      // Light-colored buttons on a dark bar
      setStyle('light');
    } catch {
      // Ignore unsupported environments
    }

    void setVisibilityAsync('visible').catch(() => {
      // Ignore unsupported environments
    });
  }, []);

  if (Platform.OS !== 'android') return null;

  return <NavigationBar style="light" />;
}

export const ANDROID_NAV_BACKGROUND = colors.background;
