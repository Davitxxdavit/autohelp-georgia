import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Surface } from '@/components/ui/Surface';
import { hrefForRecoveredRequest } from '@/features/services/flow/requestFlow';
import type { ApiServiceRequest } from '@/lib/api/types';
import {
  requestStatusLabel,
  serviceCodeLabel,
} from '@/lib/api/status';
import { spacing } from '@/theme/spacing';

type Props = {
  request: ApiServiceRequest;
};

export function ActiveRequestCard({ request }: Props) {
  const router = useRouter();
  const href = hrefForRecoveredRequest(request);

  return (
    <Surface elevated padded radiusToken="lg" style={styles.card}>
      <StatusBadge label="Assistance in progress" tone="primary" />
      <AppText variant="bodyMedium" style={styles.title}>
        {serviceCodeLabel(request.service_code)}
      </AppText>
      <AppText variant="caption" color="textSecondary">
        {requestStatusLabel(request.status)}
      </AppText>
      {href ? (
        <View style={styles.cta}>
          <PrimaryButton
            label="View request"
            onPress={() => router.replace(href)}
          />
        </View>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  title: {
    marginTop: spacing.xxs,
  },
  cta: {
    paddingTop: spacing.xs,
  },
});
