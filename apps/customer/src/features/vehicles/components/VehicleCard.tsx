import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { timing } from '@/animations/timing';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';

import { fuelLabel, vehicleTitle } from '../display';
import type { Vehicle } from '../types';

export type VehicleCardProps = {
  vehicle: Vehicle;
  index?: number;
  selected?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSelectPrimary?: () => void;
  compact?: boolean;
};

export function VehicleCard({
  vehicle,
  index = 0,
  selected,
  onPress,
  onEdit,
  onDelete,
  onSelectPrimary,
  compact = false,
}: VehicleCardProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 14);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const ease = Easing.bezier(0.16, 1, 0.3, 1);
    opacity.value = withDelay(
      index * 70,
      withTiming(1, { duration: timing.normal, easing: ease }),
    );
    translateY.value = withDelay(
      index * 70,
      withTiming(0, { duration: timing.normal, easing: ease }),
    );
  }, [index, opacity, reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const meta = [
    String(vehicle.year),
    vehicle.engine?.trim() || undefined,
    fuelLabel(vehicle.fuel),
  ]
    .filter(Boolean)
    .join('  ·  ');

  const confirmDelete = () => {
    setMenuOpen(false);
    Alert.alert('წაშალო ეს მანქანა?', 'ეს მოქმედება ვერ გაუქმდება.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(),
      },
    ]);
  };

  if (compact) {
    return (
      <Animated.View style={animatedStyle}>
        <AnimatedPressable
          accessibilityLabel={vehicleTitle(vehicle)}
          onPress={onPress}
          style={[styles.pressable, selected && styles.selected]}
        >
          <GradientSurface
            colors={[colors.surfaceElevated, colors.surface]}
            radiusToken="lg"
            style={styles.compactCard}
          >
            <View style={styles.compactCopy}>
              <AppText variant="bodyMedium">{vehicle.make}</AppText>
              <AppText variant="h3">{vehicle.model}</AppText>
              <AppText variant="caption" color="textSecondary">
                {meta}
              </AppText>
            </View>
            <CarSilhouette width={120} height={44} />
          </GradientSurface>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.cardShell}>
        <AnimatedPressable
          accessibilityLabel={vehicleTitle(vehicle)}
          onPress={onPress}
          style={styles.pressable}
        >
          <GradientSurface
            colors={[
              colors.surfaceElevated,
              colors.background,
              colors.primarySoft,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            radiusToken="xl"
            style={[styles.card, shadows.sm]}
          >
            <View style={styles.titleBlock}>
              <AppText variant="caption" color="textMuted">
                {vehicle.nickname?.trim() || 'ავტომობილი'}
              </AppText>
              <AppText variant="h2">{vehicle.make}</AppText>
              <AppText variant="h1" style={styles.model}>
                {vehicle.model}
              </AppText>
            </View>

            <View style={styles.visualRow}>
              <CarSilhouette width={200} height={68} />
            </View>

            <AppText variant="body" color="textSecondary">
              {meta}
            </AppText>

            {vehicle.isPrimary ? (
              <View style={styles.primaryRow}>
                <View style={styles.primaryDot} />
                <AppText variant="caption" color="primary">
                  ძირითადი მანქანა
                </AppText>
              </View>
            ) : (
              <View style={styles.primarySpacer} />
            )}

            <View style={styles.divider} />

            <View style={styles.footerRow}>
              <AppText variant="bodyMedium">მანქანის დეტალები</AppText>
              <AppText variant="h3" color="textMuted">
                ›
              </AppText>
            </View>
          </GradientSurface>
        </AnimatedPressable>

        <AnimatedPressable
          accessibilityLabel="მანქანის მენიუ"
          accessibilityRole="button"
          onPress={() => setMenuOpen(true)}
          style={styles.menuButton}
        >
          <AppText variant="h3" color="textSecondary">
            •••
          </AppText>
        </AnimatedPressable>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.menuBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuOpen(false)}
            accessibilityLabel="Close menu"
          />
          <View style={styles.menuSheet}>
            <AppText variant="label" color="textMuted" style={styles.menuTitle}>
              {vehicle.make} {vehicle.model}
            </AppText>
            {onEdit ? (
              <MenuItem
                label="Edit"
                onPress={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              />
            ) : null}
            {onSelectPrimary && !vehicle.isPrimary ? (
              <MenuItem
                label="Make primary"
                onPress={() => {
                  setMenuOpen(false);
                  onSelectPrimary();
                }}
              />
            ) : null}
            {onDelete ? (
              <MenuItem label="Delete" danger onPress={confirmDelete} />
            ) : null}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

function MenuItem({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.menuItem}
    >
      <AppText variant="bodyMedium" color={danger ? 'danger' : 'textPrimary'}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    position: 'relative',
  },
  pressable: {
    borderRadius: radius.xl,
  },
  selected: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  card: {
    padding: spacing.xl,
    gap: spacing.md,
    overflow: 'hidden',
  },
  compactCard: {
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  compactCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  titleBlock: {
    gap: spacing.xxs,
    paddingRight: spacing['3xl'],
  },
  model: {
    marginTop: -spacing.xxs,
  },
  menuButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 2,
  },
  visualRow: {
    alignItems: 'flex-end',
    marginVertical: spacing.xs,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  primaryDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  primarySpacer: {
    height: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    padding: spacing.xl,
  },
  menuSheet: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  menuTitle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  menuItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
