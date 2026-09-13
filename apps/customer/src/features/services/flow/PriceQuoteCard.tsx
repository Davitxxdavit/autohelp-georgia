import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Surface } from '@/components/ui/Surface';
import { isApiError } from '@/lib/api/errors';
import {
  approveRequestPrice,
  rejectRequestPrice,
} from '@/lib/api/requests';
import { formatRequestEstimate } from '@/lib/api/status';
import type { ApiServiceRequest } from '@/lib/api/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type PriceQuoteCardProps = {
  request: ApiServiceRequest | null | undefined;
  onUpdated: (next: ApiServiceRequest) => void;
};

export function PriceQuoteCard({ request, onUpdated }: PriceQuoteCardProps) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!request) return null;

  const status = request.quote_status;
  const amount = request.final_price_amount ?? null;
  const currency = request.estimated_price_currency || 'GEL';
  const display = formatRequestEstimate(amount, currency);
  const mechanicProposed = Boolean(request.price_proposed_at);

  if (status === 'APPROVED' && mechanicProposed && amount) {
    return (
      <Surface elevated padded style={styles.card}>
        <AppText variant="label" color="success">
          Service price
        </AppText>
        <AppText variant="h3">Price approved — {display}</AppText>
      </Surface>
    );
  }

  if (status === 'REJECTED') {
    return (
      <Surface elevated padded style={styles.card}>
        <AppText variant="label" color="danger">
          Service price
        </AppText>
        <AppText variant="bodyMedium">
          Price rejected. Waiting for a new quote.
        </AppText>
      </Surface>
    );
  }

  if (status !== 'PENDING' || !amount) return null;

  const onApprove = () => {
    if (busy) return;
    setBusy('approve');
    setError(null);
    void (async () => {
      try {
        const next = await approveRequestPrice(request.id, amount);
        onUpdated(next);
      } catch (caught) {
        setError(
          isApiError(caught)
            ? caught.message
            : 'Could not approve the price. Try again.',
        );
      } finally {
        setBusy(null);
      }
    })();
  };

  const onReject = () => {
    if (busy) return;
    setBusy('reject');
    setError(null);
    void (async () => {
      try {
        const next = await rejectRequestPrice(request.id);
        onUpdated(next);
      } catch (caught) {
        setError(
          isApiError(caught)
            ? caught.message
            : 'Could not reject the price. Try again.',
        );
      } finally {
        setBusy(null);
      }
    })();
  };

  return (
    <Surface elevated padded style={styles.card}>
      <AppText variant="label" color="primary">
        Service price
      </AppText>
      <AppText variant="body" color="textSecondary">
        Mechanic proposed:
      </AppText>
      <AppText variant="h3">{display}</AppText>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <PrimaryButton
          label={busy === 'approve' ? 'Approving…' : 'Approve price'}
          disabled={busy !== null}
          onPress={onApprove}
        />
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Reject price"
          disabled={busy !== null}
          onPress={onReject}
          style={styles.reject}
        >
          <AppText variant="button" color="danger">
            {busy === 'reject' ? 'Rejecting…' : 'Reject'}
          </AppText>
        </AnimatedPressable>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  reject: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    opacity: 1,
    backgroundColor: colors.transparent,
  },
});
