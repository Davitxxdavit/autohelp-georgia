import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { formatMoneyAmount } from '@/features/earnings/format';
import { formatDateTime } from '@/lib/datetime';
import { isApiError } from '@/lib/api/errors';
import { listMechanicJobHistory } from '@/lib/api/mechanic';
import type { ApiMechanicJobHistoryItem } from '@/lib/api/types';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function MechanicHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [rows, setRows] = useState<ApiMechanicJobHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setRows(await listMechanicJobHistory());
    } catch (caught) {
      setError(isApiError(caught) ? caught.message : 'Could not load history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load]),
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xl,
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void load('refresh');
          }}
          tintColor={colors.primary}
        />
      }
    >
      <AppText variant="h2">Job history</AppText>
      {loading && rows.length === 0 ? (
        <AppText variant="body" color="textMuted">
          Loading…
        </AppText>
      ) : error && rows.length === 0 ? (
        <View style={styles.block}>
          <AppText variant="body">{error}</AppText>
          <PrimaryButton label="Retry" onPress={() => void load('initial')} />
        </View>
      ) : rows.length === 0 ? (
        <AppText variant="body" color="textSecondary">
          Completed jobs will appear here.
        </AppText>
      ) : (
        rows.map((row) => (
          <View key={row.id} style={styles.card}>
            <AppText variant="label" color="primary">
              {row.service_name}
            </AppText>
            <AppText variant="bodyMedium">{row.customer_display_name}</AppText>
            <AppText variant="caption" color="textMuted">
              {formatDateTime(row.completed_at ?? row.created_at)}
            </AppText>
            {row.customer_address ? (
              <AppText variant="caption" color="textSecondary">
                {row.customer_address}
              </AppText>
            ) : null}
            <AppText variant="body">
              {row.net_amount
                ? `Net ${formatMoneyAmount(row.net_amount, row.currency ?? 'GEL')}`
                : row.final_price_amount
                  ? formatMoneyAmount(
                      row.final_price_amount,
                      row.estimated_price_currency,
                    )
                  : '—'}
            </AppText>
          </View>
        ))
      )}
      <PrimaryButton label="Back" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  block: {
    gap: spacing.sm,
  },
});
