import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { timing } from '@/animations/timing';
import { CarSilhouette } from '@/components/automotive/CarSilhouette';
import { ServiceIcon } from '@/components/automotive/ServiceIcon';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Surface } from '@/components/ui/Surface';
import { SERVICE_ICON_KIND } from '@/constants/serviceIcons';
import { getServiceById } from '@/constants/services';
import { readRequests } from '@/features/requests/storage';
import type { ServiceRequest } from '@/features/requests/types';
import {
  vehicleTitle,
} from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type Phase = 'searching' | 'received';

/**
 * MOCK status — no mechanic was contacted.
 * Animates Searching → Request received for UX testing only.
 */
export default function RequestSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const { getById } = useVehicles();

  const [phase, setPhase] = useState<Phase>('searching');
  const [request, setRequest] = useState<ServiceRequest | null>(null);

  const pulse = useSharedValue(1);

  useEffect(() => {
    let mounted = true;
    if (!requestId) return;
    void readRequests().then((items) => {
      if (!mounted) return;
      setRequest(items.find((item) => item.id === requestId) ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [requestId]);

  useEffect(() => {
    const timer = setTimeout(() => setPhase('received'), reducedMotion ? 600 : 2200);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || phase !== 'searching') {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1.06, {
        duration: timing.slow,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [phase, pulse, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const service = request ? getServiceById(request.serviceId) : undefined;
  const vehicle = request ? getById(request.vehicleId) : undefined;

  const title = useMemo(() => {
    if (phase === 'searching') return 'Finding a specialist...';
    return 'Request received';
  }, [phase]);

  return (
    <>
      <Stack.Screen options={{ title: 'Request', headerBackVisible: false }} />
      <View
        style={[
          styles.screen,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Surface elevated padded radiusToken="xl" style={styles.card}>
          <StatusBadge
            label={phase === 'searching' ? 'Searching' : 'Received'}
            tone={phase === 'searching' ? 'warning' : 'success'}
          />

          <Animated.View style={[styles.visual, pulseStyle]}>
            {service ? (
              <ServiceIcon kind={SERVICE_ICON_KIND[service.id]} size={36} />
            ) : (
              <CarSilhouette width={200} height={68} />
            )}
          </Animated.View>

          <AppText variant="h2" style={styles.title}>
            {title}
          </AppText>

          {phase === 'searching' ? (
            <View style={styles.searchingRow}>
              <ActivityIndicator color={colors.primary} />
              <AppText variant="body" color="textSecondary" style={styles.body}>
                Finding a nearby specialist
              </AppText>
            </View>
          ) : (
            <AppText variant="body" color="textSecondary" style={styles.body}>
              We received your request and will match a specialist shortly.
            </AppText>
          )}

          {request && service ? (
            <View style={styles.summary}>
              <AppText variant="bodyMedium">
                {service.emoji} {request.details}
              </AppText>
              {vehicle ? (
                <AppText variant="body" color="textSecondary">
                  {vehicleTitle(vehicle)}
                </AppText>
              ) : null}
              <AppText variant="body" color="textSecondary">
                📍 {request.locationLabel.includes('Batumi') ? 'Batumi' : request.locationLabel}
              </AppText>
              <AppText variant="caption" color="textMuted">
                Status: Finding a nearby specialist
              </AppText>
            </View>
          ) : null}

          <AppText variant="caption" color="textMuted" style={styles.disclaimer}>
            Mock request only — no specialist was contacted.
          </AppText>
        </Surface>

        <PrimaryButton
          label="Back to Home"
          onPress={() => {
            router.replace('/(app)/(tabs)');
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing['2xl'],
  },
  visual: {
    marginVertical: spacing.sm,
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summary: {
    alignSelf: 'stretch',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  disclaimer: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
