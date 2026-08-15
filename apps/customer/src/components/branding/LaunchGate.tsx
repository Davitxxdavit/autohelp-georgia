import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AutoHelpLaunchVisual } from '@/components/branding/AutoHelpLaunchVisual';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';

type LaunchGateContextValue = {
  /** True after the launch visual has finished (fade may still be running). */
  launchComplete: boolean;
};

const LaunchGateContext = createContext<LaunchGateContextValue>({
  launchComplete: false,
});

export function useLaunchGate(): LaunchGateContextValue {
  return useContext(LaunchGateContext);
}

type LaunchGateProps = {
  children: ReactNode;
};

/**
 * Full-screen automatic launch overlay.
 * Always dismisses after the visual completes (safety timeout included).
 */
export function LaunchGate({ children }: LaunchGateProps) {
  const [showLaunch, setShowLaunch] = useState(true);
  const [launchComplete, setLaunchComplete] = useState(false);
  const overlayOpacity = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const dismissedRef = useRef(false);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markLaunchComplete = useCallback(() => {
    setLaunchComplete(true);
  }, []);

  const dismissOverlay = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    setShowLaunch(false);
  }, []);

  const handleLaunchComplete = useCallback(() => {
    if (dismissedRef.current) return;

    // Allow routing as soon as the visual finishes — overlay is still fading.
    markLaunchComplete();

    const fadeMs = reducedMotion ? timing.fast : timing.slow;

    // Always remove the blocking overlay — do not depend solely on `finished`.
    overlayOpacity.value = withTiming(
      0,
      {
        duration: fadeMs,
        easing: Easing.bezier(0.4, 0.0, 1, 1),
      },
      () => {
        runOnJS(dismissOverlay)();
      },
    );

    // Safety net if the Reanimated callback never runs
    safetyTimerRef.current = setTimeout(() => {
      dismissOverlay();
    }, fadeMs + 250);
  }, [dismissOverlay, markLaunchComplete, overlayOpacity, reducedMotion]);

  useEffect(() => {
    return () => {
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contextValue = useMemo(
    () => ({ launchComplete }),
    [launchComplete],
  );

  return (
    <LaunchGateContext.Provider value={contextValue}>
      <View style={styles.root}>
        {children}

        {showLaunch ? (
          <Animated.View
            style={[styles.overlay, overlayStyle]}
            // Block interaction only while visible; removed on dismiss
            pointerEvents="auto"
            accessibilityViewIsModal
            accessibilityLabel="AutoHelp is launching"
          >
            <AutoHelpLaunchVisual
              fullscreen
              duration={timing.launch}
              reducedMotion={!!reducedMotion}
              onComplete={handleLaunchComplete}
            />
          </Animated.View>
        ) : null}
      </View>
    </LaunchGateContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: colors.background,
  },
});
