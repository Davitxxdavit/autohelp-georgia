import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { RoadLines } from '@/components/automotive/RoadLines';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export type VehiclesEmptyProps = {
  onAdd: () => void;
};

export function VehiclesEmpty({ onAdd }: VehiclesEmptyProps) {
  const reducedMotion = useReducedMotion();
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, {
          duration: timing.slow * 2,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: timing.slow * 2,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );
  }, [floatY, reducedMotion]);

  const artStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={artStyle}>
        <GradientSurface
          colors={[colors.surfaceElevated, colors.background]}
          radiusToken="xl"
          style={styles.art}
        >
          <RoadLines width={220} height={18} />
          <CarSilhouette width={220} height={72} />
        </GradientSurface>
      </Animated.View>

      <AppText variant="h3" style={styles.title}>
        დაამატე შენი მანქანა
      </AppText>
      <AppText variant="body" color="textSecondary" style={styles.description}>
        შეინახე შენი ავტომობილი, რომ დახმარების გამოძახება უფრო სწრაფი იყოს.
      </AppText>

      <PrimaryButton label="+ მანქანის დამატება" onPress={onAdd} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  art: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
});
