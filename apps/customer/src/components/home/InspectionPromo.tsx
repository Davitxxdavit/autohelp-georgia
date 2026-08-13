import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export type InspectionPromoProps = {
  onPress?: () => void;
};

function InspectionMark() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" accessibilityElementsHidden>
      <Rect
        x={6}
        y={4}
        width={20}
        height={28}
        rx={3}
        fill="none"
        stroke={colors.textSecondary}
        strokeWidth={1.6}
      />
      <Path
        d="M12 14 H22 M12 19 H20 M12 24 H18"
        stroke={colors.border}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Circle cx={26} cy={26} r={8} fill={colors.primarySoft} stroke={colors.primary} strokeWidth={1.6} />
      <Path
        d="M22.5 26.2 L25 28.5 L30 22.5"
        fill="none"
        stroke={colors.primary}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InspectionPromo({ onPress }: InspectionPromoProps) {
  return (
    <GradientSurface
      colors={[colors.surface, colors.surfaceElevated]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      radiusToken="xl"
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <AppText variant="label" color="primary">
            ინსპექცია
          </AppText>
          <AppText variant="h3" style={styles.title}>
            მანქანის ყიდვას აპირებ?
          </AppText>
          <AppText variant="body" color="textSecondary">
            შეამოწმე მანქანა ყიდვამდე.
          </AppText>
        </View>
        <InspectionMark />
      </View>

      <AppText variant="caption" color="textMuted" style={styles.description}>
        სპეციალისტი ადგილზე შეამოწმებს მანქანის ტექნიკურ მდგომარეობას.
      </AppText>

      <View style={styles.visual}>
        <CarSilhouette width={200} height={64} color={colors.textSecondary} />
      </View>

      <AnimatedPressable
        accessibilityLabel="შეამოწმე მანქანა"
        onPress={onPress}
        style={styles.cta}
      >
        <AppText variant="button" color="onPrimary">
          შეამოწმე მანქანა
        </AppText>
      </AnimatedPressable>
    </GradientSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    marginTop: spacing.xxs,
  },
  description: {
    lineHeight: 18,
  },
  visual: {
    alignItems: 'center',
    opacity: 0.9,
    paddingVertical: spacing.xs,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
});
