import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

import type { MockMechanic } from '../types';

export function MechanicCard({
  mechanic,
  etaLabel,
  footer,
}: {
  mechanic: MockMechanic;
  etaLabel?: string;
  footer?: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <AppText variant="h3">{mechanic.name.slice(0, 1)}</AppText>
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
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
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
