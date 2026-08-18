import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';

export function CompletionMark() {
  const reducedMotion = !!useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : 0.88);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    opacity.value = withTiming(1, { duration: timing.slow });
    scale.value = withTiming(1, { duration: timing.slow });
  }, [opacity, reducedMotion, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      accessibilityLabel="Service completed"
      style={[styles.mark, style]}
    >
      <Ionicons name="checkmark" size={32} color={colors.success} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
