import { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { GradientSurface } from '@/components/ui/GradientSurface';
import { OrderCard } from '@/features/orders/OrderCard';
import { isApiError, type ApiError } from '@/lib/api/errors';
import { listServiceRequests } from '@/lib/api/requests';
import { isHistoryRequestStatus } from '@/lib/api/status';
import type { ApiServiceRequest } from '@/lib/api/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [requests, setRequests] = useState<ApiServiceRequest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const next = await listServiceRequests();
      setRequests(next);
    } catch (caught) {
      if (__DEV__) {
        console.warn('[AutoHelp] Orders load failed', caught);
        if (isApiError(caught)) {
          console.warn('[AutoHelp] status', caught.status, 'body', caught.body);
        }
      }
      setError(isApiError(caught) ? caught : null);
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

  const active = (requests ?? []).filter(
    (item) => !isHistoryRequestStatus(item.status),
  );
  const history = (requests ?? []).filter((item) =>
    isHistoryRequestStatus(item.status),
  );
  const showEmpty = requests !== null && requests.length === 0 && !error;
  const showError = error && requests === null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}>
      <AppText variant="h2">შეკვეთები</AppText>
      <AppText variant="body" color="textSecondary">
        აქ გამოჩნდება შენი შეკვეთების ისტორია.
      </AppText>

      {loading && requests === null ? (
        <AppText variant="body" color="textMuted">
          იტვირთება…
        </AppText>
      ) : showError ? (
        <View style={styles.errorBlock}>
          <AppText variant="bodyMedium">Couldn’t load your orders.</AppText>
          <AppText variant="caption" color="textMuted">
            Check your connection and try again.
          </AppText>
          <PrimaryButton
            label="Try again"
            onPress={() => {
              void load('initial');
            }}
          />
        </View>
      ) : showEmpty ? (
        <GradientSurface
          colors={[colors.surfaceElevated, colors.background]}
          radiusToken="xl"
          style={styles.empty}
        >
          <CarSilhouette width={180} height={60} color={colors.textMuted} />
          <AppText variant="h3" style={styles.emptyTitle}>
            ჯერ შეკვეთები არ გაქვს
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.emptyCopy}>
            დახმარების გამოძახების შემდეგ შენი შეკვეთები და სტატუსები აქ
            გამოჩნდება.
          </AppText>
          <PrimaryButton
            label="მთავარზე გადასვლა"
            onPress={() => router.push('/(app)/(tabs)')}
          />
        </GradientSurface>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
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
          {active.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="label" color="textMuted">
                აქტიური
              </AppText>
              {active.map((item) => (
                <OrderCard key={item.id} request={item} />
              ))}
            </View>
          ) : null}
          {history.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="label" color="textMuted">
                ისტორია
              </AppText>
              {history.map((item) => (
                <OrderCard key={item.id} request={item} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  list: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  empty: {
    marginTop: spacing.lg,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyCopy: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorBlock: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
