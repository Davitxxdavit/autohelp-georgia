import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import {
  formatEarningWhen,
  formatMoneyAmount,
} from '@/features/earnings/format';
import { listMechanicEarnings } from '@/lib/api/mechanic';
import type {
  ApiMechanicEarning,
  ApiMechanicEarningsSummary,
} from '@/lib/api/types';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

const EMPTY_SUMMARY: ApiMechanicEarningsSummary = {
  today: '0.00',
  total: '0.00',
  completed_jobs: 0,
  currency: 'GEL',
};

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [summary, setSummary] = useState<ApiMechanicEarningsSummary>(EMPTY_SUMMARY);
  const [results, setResults] = useState<ApiMechanicEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const loadedOnce = useRef(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else if (!loadedOnce.current) setLoading(true);
    setError(false);
    try {
      const data = await listMechanicEarnings();
      setSummary(data.summary);
      setResults(data.results ?? []);
      loadedOnce.current = true;
    } catch {
      setError(true);
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

  if (loading && !refreshing) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.screen,
          styles.centered,
          {
            paddingTop: insets.top + spacing.xl,
            paddingHorizontal: spacing.xl,
          },
        ]}
      >
        <AppText variant="h3">Couldn&apos;t load earnings.</AppText>
        <AppText variant="body" color="textSecondary" style={styles.centerText}>
          Check your connection and try again.
        </AppText>
        <PrimaryButton label="Retry" onPress={() => void load('initial')} />
      </View>
    );
  }

  const currency = summary.currency || 'GEL';
  const empty = results.length === 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.xl },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void load('refresh')}
          tintColor={colors.primary}
        />
      }
    >
      <AppText variant="h2">Earnings</AppText>
      <PrimaryButton
        label="Job history"
        onPress={() => router.push('/history' as Href)}
      />

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <AppText variant="caption" color="textMuted">
            Today
          </AppText>
          <AppText variant="h3">
            {formatMoneyAmount(summary.today, currency)}
          </AppText>
        </View>
        <View style={styles.summaryCard}>
          <AppText variant="caption" color="textMuted">
            Total
          </AppText>
          <AppText variant="h3">
            {formatMoneyAmount(summary.total, currency)}
          </AppText>
        </View>
      </View>
      <View style={styles.summaryCard}>
        <AppText variant="caption" color="textMuted">
          Completed jobs
        </AppText>
        <AppText variant="h3">{String(summary.completed_jobs)}</AppText>
      </View>

      {empty ? (
        <View style={styles.empty}>
          <AppText variant="h3">No earnings yet.</AppText>
          <AppText variant="body" color="textSecondary">
            Complete your first service to see earnings here.
          </AppText>
        </View>
      ) : (
        <View style={styles.history}>
          {results.map((item) => (
            <View key={item.id} style={styles.row}>
              <View style={styles.rowText}>
                <AppText variant="bodyMedium">{item.service_name}</AppText>
                <AppText variant="caption" color="textMuted">
                  {formatEarningWhen(item.created_at)}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {formatMoneyAmount(item.gross_amount, item.currency)} service ·{' '}
                  {formatMoneyAmount(item.commission_amount, item.currency)}{' '}
                  commission
                </AppText>
              </View>
              <AppText variant="bodyMedium">
                {formatMoneyAmount(item.net_amount, item.currency)}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  centerText: {
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  history: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowText: {
    flex: 1,
    gap: spacing.xxs,
  },
});
