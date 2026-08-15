import { StyleSheet, View } from 'react-native';

import { RoadLines } from '@/components/automotive/RoadLines';
import { AppText } from '@/components/ui/AppText';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { MOCK_LOCATION } from '@/features/requests/questions';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export type LocationCardProps = {
  label?: string;
  cityLabel?: string;
  hint?: string;
};

/**
 * Map/location visual placeholder — no real maps SDK.
 */
export function LocationCard({
  label = 'Location',
  cityLabel = MOCK_LOCATION.label,
  hint = MOCK_LOCATION.pinHint,
}: LocationCardProps) {
  return (
    <GradientSurface
      colors={[colors.surfaceElevated, colors.background]}
      radiusToken="lg"
      style={styles.card}
    >
      <View style={styles.mapPlaceholder} accessibilityLabel="Map placeholder">
        <View style={styles.mapGrid}>
          <View style={styles.gridLineH} />
          <View style={[styles.gridLineH, styles.gridLineH2]} />
          <View style={styles.gridLineV} />
          <View style={[styles.gridLineV, styles.gridLineV2]} />
        </View>
        <RoadLines width={220} height={16} color={colors.border} />
        <View style={styles.pin}>
          <View style={styles.pinOuter}>
            <View style={styles.pinInner} />
          </View>
        </View>
      </View>

      <View style={styles.copy}>
        <AppText variant="caption" color="textMuted">
          📍 {label}
        </AppText>
        <AppText variant="h3">{cityLabel}</AppText>
        <AppText variant="caption" color="textSecondary">
          {hint}
        </AppText>
      </View>
    </GradientSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    gap: 0,
  },
  mapPlaceholder: {
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mapGrid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.45,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '38%',
    height: 1,
    backgroundColor: colors.border,
  },
  gridLineH2: {
    top: '62%',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '34%',
    width: 1,
    backgroundColor: colors.border,
  },
  gridLineV2: {
    left: '66%',
  },
  pin: {
    position: 'absolute',
    top: '28%',
  },
  pinOuter: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pinInner: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  copy: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
});
