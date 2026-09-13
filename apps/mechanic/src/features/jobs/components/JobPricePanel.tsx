import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { formatMoneyAmount } from '@/features/earnings/format';
import type { MockJob } from '@/features/jobs/types';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function toPayloadAmount(raw: string): string | null {
  const match = raw.trim().match(/^(\d+)(?:\.(\d{0,2}))?$/);
  if (!match) return null;
  const whole = (match[1] ?? '0').replace(/^0+(?=\d)/, '') || '0';
  const frac = (match[2] ?? '').padEnd(2, '0').slice(0, 2);
  if (whole === '0' && frac === '00') return null;
  return `${whole}.${frac}`;
}

function sanitizeAmount(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) return cleaned;
  return `${cleaned.slice(0, dot + 1)}${cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2)}`;
}

export function JobPricePanel({
  job,
  disabled,
  onPropose,
}: {
  job: MockJob;
  disabled?: boolean;
  onPropose: (amount: string) => Promise<unknown>;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canEdit =
    job.status === 'ACCEPTED' ||
    job.status === 'ON_THE_WAY' ||
    job.status === 'ARRIVED';
  const approved = job.quoteStatus === 'APPROVED' && Boolean(job.finalPriceAmount);
  const pending = job.quoteStatus === 'PENDING';
  const rejected = job.quoteStatus === 'REJECTED';
  const display = job.finalPriceAmount
    ? formatMoneyAmount(job.finalPriceAmount, 'GEL')
    : null;

  const headline = (() => {
    if (approved && display) {
      return job.priceProposedAt
        ? `Customer approved: ${display}`
        : `Service price: ${display}`;
    }
    if (pending && display) return `Waiting for customer approval — ${display}`;
    if (rejected) return 'Price rejected. Set a new service price.';
    return 'Price not set';
  })();

  const openEditor = () => {
    setDraft(job.finalPriceAmount?.replace(/\.00$/, '') ?? '');
    setError(null);
    setOpen(true);
  };

  const submit = () => {
    const payload = toPayloadAmount(draft);
    if (!payload) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    setBusy(true);
    setError(null);
    void (async () => {
      try {
        const next = await onPropose(payload);
        if (next) setOpen(false);
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" color="textMuted">
        Service price
      </AppText>
      <AppText variant="bodyMedium">{headline}</AppText>
      {canEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Set service price"
          disabled={disabled || busy}
          onPress={openEditor}
        >
          <AppText variant="button" color="primary">
            {approved || pending ? 'Change price' : 'Set service price'}
          </AppText>
        </Pressable>
      ) : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View
          style={[
            styles.modal,
            {
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
        >
          <AppText variant="h3">Set service price</AppText>
          <AppText variant="body" color="textSecondary">
            Amount in GEL. The customer must approve a new quote.
          </AppText>
          <TextInput
            value={draft}
            onChangeText={(value) => {
              setDraft(sanitizeAmount(value));
              if (error) setError(null);
            }}
            placeholder="120.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            inputMode="decimal"
            accessibilityLabel="Service price amount"
            editable={!busy}
            style={styles.input}
          />
          <AppText variant="caption" color="textMuted">
            GEL
          </AppText>
          {error ? (
            <AppText variant="caption" color="danger">
              {error}
            </AppText>
          ) : null}
          <PrimaryButton
            label={busy ? 'Sending…' : 'Send quote'}
            disabled={busy || !toPayloadAmount(draft)}
            onPress={submit}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            disabled={busy}
            onPress={() => setOpen(false)}
          >
            <AppText variant="button" color="textSecondary" style={styles.center}>
              Cancel
            </AppText>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    justifyContent: 'center',
  },
  input: {
    ...typography.h2,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: {
    textAlign: 'center',
  },
});
