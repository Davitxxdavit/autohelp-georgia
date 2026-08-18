import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  NavigationBar,
  setStyle,
  setVisibilityAsync,
} from 'expo-navigation-bar';

/**
 * Keep the Android system navigation bar visible and themed.
 */
export function AndroidNavigationBar() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    try {
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
