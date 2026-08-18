import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import type { MockMechanic } from './types';

export function MechanicCard({
  mechanic,
  etaLabel,
  footer,
  variant = 'compact',
}: {
  mechanic: MockMechanic;
  etaLabel?: string;
  footer?: string;
  /** `identity` is the Found-screen hero. Tracking keeps `compact`. */
  variant?: 'compact' | 'identity';
}) {
  const initial = mechanic.name.slice(0, 1);

  if (variant === 'identity') {
    return (
      <View style={styles.identity} accessibilityLabel={mechanic.name}>
        <View style={styles.avatarLg}>
          <AppText variant="h2">{initial}</AppText>
        </View>
        <AppText variant="h2" style={styles.name}>
          {mechanic.name}
        </AppText>
        {mechanic.verified ? (
          <StatusBadge label="Verified" tone="success" />
        ) : null}
        <AppText variant="caption" color="textSecondary">
          ★ {mechanic.rating.toFixed(1)}
          {`  ·  ${mechanic.distanceKm} km`}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <AppText variant="h3">{initial}</AppText>
      </View>
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <AppText variant="bodyMedium">{mechanic.name}</AppText>
          {mechanic.verified ? (
            <StatusBadge label="Verified" tone="success" />
          ) : null}
        </View>
        <AppText variant="caption" color="textSecondary">
          ⭐ {mechanic.rating.toFixed(1)}
          {etaLabel ? `  ·  ${etaLabel}` : ''}
        </AppText>
        {footer ? (
          <AppText variant="caption" color="textMuted">
            {footer}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLg: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    textAlign: 'center',
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
