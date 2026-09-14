import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { Divider } from '@/components/ui/Divider';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Surface } from '@/components/ui/Surface';
import { hrefForRecoveredRequest } from '@/features/services/flow/requestFlow';
import { formatDateTime } from '@/lib/datetime';
import { isApiError, type ApiError } from '@/lib/api/errors';
import { getServiceRequest } from '@/lib/api/requests';
import {
  formatRequestPrice,
  isActiveRequestStatus,
  requestStatusLabel,
  requestStatusTone,
  serviceCodeLabel,
} from '@/lib/api/status';
import type { ApiServiceRequest } from '@/lib/api/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<ApiServiceRequest | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setRequest(await getServiceRequest(id));
    } catch (caught) {
      setError(isApiError(caught) ? caught : null);
      setRequest(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const mechanic = request?.assigned_mechanic;
  const vehicle = request?.vehicle;
  const rating = request?.rating;
  const continueHref = request ? hrefForRecoveredRequest(request) : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xl,
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
      }}
    >
      <AppText variant="h2">Request</AppText>
      {loading ? (
        <AppText variant="body" color="textMuted">
          Loading…
        </AppText>
      ) : error || !request ? (
        <View style={styles.block}>
          <AppText variant="bodyMedium">Couldn’t load this request.</AppText>
          <PrimaryButton label="Try again" onPress={() => void load()} />
        </View>
      ) : (
        <Surface elevated padded style={styles.card}>
          <StatusBadge
            label={requestStatusLabel(request.status)}
            tone={requestStatusTone(request.status)}
          />
          <AppText variant="h3">{serviceCodeLabel(request.service_code)}</AppText>
          {request.status === 'CANCELLED' ? (
            <AppText variant="body" color="danger">
              This request was cancelled.
            </AppText>
          ) : null}
          {request.status === 'DECLINED' ? (
            <AppText variant="body" color="danger">
              This request was declined.
            </AppText>
          ) : null}
          <Divider />
          <AppText variant="caption" color="textMuted">
            Created
          </AppText>
          <AppText variant="body">{formatDateTime(request.created_at)}</AppText>
          {request.completed_at ? (
            <>
              <AppText variant="caption" color="textMuted">
                Completed
              </AppText>
              <AppText variant="body">{formatDateTime(request.completed_at)}</AppText>
            </>
          ) : null}
          {request.cancelled_at ? (
            <>
              <AppText variant="caption" color="textMuted">
                Cancelled
              </AppText>
              <AppText variant="body">{formatDateTime(request.cancelled_at)}</AppText>
            </>
          ) : null}
          <AppText variant="caption" color="textMuted">
            Price
          </AppText>
          <AppText variant="bodyMedium">{formatRequestPrice(request)}</AppText>
          {vehicle ? (
            <>
              <AppText variant="caption" color="textMuted">
                Vehicle
              </AppText>
              <AppText variant="body">
                {vehicle.make} {vehicle.model} · {vehicle.year}
              </AppText>
            </>
          ) : null}
          {mechanic?.first_name ? (
            <>
              <AppText variant="caption" color="textMuted">
                Mechanic
              </AppText>
              <AppText variant="body">{mechanic.first_name}</AppText>
            </>
          ) : null}
          {rating ? (
            <>
              <AppText variant="caption" color="textMuted">
                Your rating
              </AppText>
              <AppText variant="body">{rating.stars} / 5</AppText>
            </>
          ) : null}
          {isActiveRequestStatus(request.status) && continueHref ? (
            <PrimaryButton
              label="Continue"
              onPress={() => router.replace(continueHref as Href)}
            />
          ) : null}
        </Surface>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    gap: spacing.sm,
  },
  block: {
    gap: spacing.sm,
  },
});
