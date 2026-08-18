import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import type { MockLocation } from './types';

/**
 * Visual stand-in for a map. Swap for MapView + expo-location later.
 */
export function MockMap({ location }: { location: MockLocation }) {
  return (
    <GradientSurface
      colors={[colors.surfaceElevated, colors.background]}
      radiusToken="xl"
      style={styles.root}
    >
      <View style={styles.grid} accessibilityElementsHidden>
        {Array.from({ length: 6 }).map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {Array.from({ length: 5 }).map((__, col) => (
              <View key={col} style={styles.cell} />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.pinWrap}>
        <View style={styles.pinHalo} />
        <View style={styles.pin} />
        <AppText variant="caption" color="textSecondary" style={styles.pinLabel}>
          {location.city}
        </AppText>
      </View>
    </GradientSurface>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 220,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    ...StyleSheet.absoluteFill,
    padding: spacing.md,
    gap: spacing.md,
    opacity: 0.45,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  cell: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pinWrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  pinHalo: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    top: -10,
  },
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.textPrimary,
  },
  pinLabel: {
    marginTop: spacing.xs,
  },
});
