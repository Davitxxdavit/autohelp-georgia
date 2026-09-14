import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter, Redirect } from 'expo-router';

import { ServiceIcon } from '@/components/automotive/ServiceIcon';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Surface } from '@/components/ui/Surface';
import { SERVICE_ICON_KIND } from '@/constants/serviceIcons';
import {
  getServiceById,
  isCustomerMvpServiceId,
  isServiceId,
} from '@/constants/services';
import { LocationCard } from '@/features/requests/components/LocationCard';
import { OptionSelectCard } from '@/features/requests/components/OptionSelectCard';
import { RequestSummary } from '@/features/requests/components/RequestSummary';
import {
  getServicePricing,
  MOCK_LOCATION,
  pricingSummaryLabel,
  SERVICE_QUESTIONS,
} from '@/features/requests/questions';
import { createDraftRequest } from '@/features/requests/storage';
import { VehicleCard } from '@/features/vehicles/components/VehicleCard';
import {
  vehicleSubtitle,
  vehicleTitle,
} from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type WizardStep = 'need' | 'vehicle' | 'location' | 'confirm';

const STEPS: WizardStep[] = ['need', 'vehicle', 'location', 'confirm'];

/**
 * Legacy request wizard. Battery / Diagnostics / Auto Key use dedicated GPS
 * flows. This screen only remains so leftover /request/[service] deep links
 * redirect instead of creating a mock-location draft.
 */
export default function RequestServiceScreen() {
  const router = useRouter();
  const { service: serviceParam } = useLocalSearchParams<{ service: string }>();
  const serviceId = typeof serviceParam === 'string' ? serviceParam : '';
  const service = isServiceId(serviceId) ? getServiceById(serviceId) : undefined;
  const mvpAllowed = isCustomerMvpServiceId(serviceId);
  const { vehicles, primaryVehicle, ready } = useVehicles();

  const [step, setStep] = useState<WizardStep>('need');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [optionId, setOptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (primaryVehicle && !selectedVehicleId) {
      setSelectedVehicleId(primaryVehicle.id);
    }
  }, [primaryVehicle, selectedVehicleId]);

  const question = service ? SERVICE_QUESTIONS[service.id] : null;
  const pricing = service ? getServicePricing(service.id) : null;
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const problemLabel = useMemo(() => {
    if (!question || question.mode !== 'options') return '—';
    return question.options.find((item) => item.id === optionId)?.label ?? '—';
  }, [optionId, question]);

  const stepIndex = STEPS.indexOf(step);

  const goNext = useCallback(() => {
    setFormError(null);
    if (step === 'need') {
      if (!optionId) {
        setFormError('Please select an option');
        return;
      }
      setStep('vehicle');
      return;
    }
    if (step === 'vehicle') {
      if (!selectedVehicleId) {
        setFormError('Please select a vehicle');
        return;
      }
      setStep('location');
      return;
    }
    if (step === 'location') {
      setStep('confirm');
    }
  }, [optionId, selectedVehicleId, step]);

  const goBack = useCallback(() => {
    setFormError(null);
    if (step === 'need') {
      router.back();
      return true;
    }
    const prev = STEPS[Math.max(0, stepIndex - 1)];
    setStep(prev);
    return true;
  }, [router, step, stepIndex]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () =>
        goBack(),
      );
      return () => sub.remove();
    }, [goBack]),
  );

  const onSubmit = async () => {
    if (!service || !selectedVehicle || !optionId || !pricing || submitting) {
      setFormError('Please complete all steps');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const request = await createDraftRequest({
        vehicleId: selectedVehicle.id,
        serviceId: service.id,
        details: problemLabel,
        locationLabel: MOCK_LOCATION.label,
        estimatedPriceLabel: pricingSummaryLabel(pricing),
      });

      router.replace({
        pathname: '/request/success',
        params: { requestId: request.id },
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (serviceId === 'battery') {
    return <Redirect href="/battery" />;
  }
  if (serviceId === 'diagnostics') {
    return <Redirect href="/diagnostics" />;
  }
  if (serviceId === 'keys') {
    return <Redirect href="/keys" />;
  }

  if (!service || !question || !pricing || !mvpAllowed) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <AppText variant="body" color="textSecondary">
          This service is not available in the current MVP.
        </AppText>
        <PrimaryButton label="Back to Home" onPress={() => router.replace('/(app)/(tabs)')} />
      </View>
    );
  }

  if (question.mode !== 'options') {
    return (
      <View style={[styles.screen, styles.centered]}>
        <AppText variant="body" color="textSecondary">
          This service flow is not configured for MVP.
        </AppText>
      </View>
    );
  }

  const screenTitle = service.requestTitle;

  return (
    <>
      <Stack.Screen options={{ title: screenTitle }} />
      <View style={styles.screen}>
        <View style={styles.progress}>
          {STEPS.map((item, index) => (
            <View
              key={item}
              style={[
                styles.progressDot,
                index <= stepIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Surface elevated padded style={styles.hero}>
            <ServiceIcon kind={SERVICE_ICON_KIND[service.id]} size={28} />
            <View style={styles.heroCopy}>
              <AppText variant="h3">{screenTitle}</AppText>
              <AppText variant="caption" color="textSecondary">
                {service.emoji} {service.title}
              </AppText>
            </View>
          </Surface>

          {step === 'need' ? (
            <View style={styles.section}>
              <AppText variant="h3">{question.prompt}</AppText>
              <View style={styles.options}>
                {question.options.map((option, index) => (
                  <OptionSelectCard
                    key={option.id}
                    label={option.label}
                    index={index}
                    selected={optionId === option.id}
                    onPress={() => setOptionId(option.id)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {step === 'vehicle' ? (
            <View style={styles.section}>
              <AppText variant="h3">Choose your vehicle</AppText>
              {!ready ? (
                <AppText variant="caption" color="textMuted">
                  Loading…
                </AppText>
              ) : vehicles.length === 0 ? (
                <Surface elevated padded style={styles.emptyVehicle}>
                  <AppText variant="bodyMedium">
                    You don't have a vehicle yet.
                  </AppText>
                  <PrimaryButton
                    label="+ Add vehicle"
                    onPress={() => router.push('/vehicle/add')}
                  />
                </Surface>
              ) : (
                <View style={styles.vehicleList}>
                  {vehicles.map((vehicle, index) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      index={index}
                      compact
                      selected={selectedVehicleId === vehicle.id}
                      onPress={() => setSelectedVehicleId(vehicle.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : null}

          {step === 'location' ? (
            <View style={styles.section}>
              <AppText variant="h3">Confirm location</AppText>
              <LocationCard cityLabel={MOCK_LOCATION.label} />
            </View>
          ) : null}

          {step === 'confirm' && selectedVehicle ? (
            <View style={styles.section}>
              <AppText variant="h3">Order summary</AppText>
              <RequestSummary
                headline={problemLabel}
                vehicleLabel={vehicleTitle(selectedVehicle)}
                vehicleMeta={String(selectedVehicle.year)}
                locationLabel={MOCK_LOCATION.shortLabel}
                pricing={pricing}
              />
            </View>
          ) : null}

          {formError ? (
            <AppText variant="caption" color="danger">
              {formError}
            </AppText>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {step !== 'need' ? (
            <AnimatedPressable
              accessibilityLabel="Back"
              onPress={() => {
                goBack();
              }}
              style={styles.backLink}
            >
              <AppText variant="bodyMedium" color="textSecondary">
                Back
              </AppText>
            </AnimatedPressable>
          ) : null}
          {step !== 'confirm' ? (
            <PrimaryButton
              label="Continue"
              onPress={goNext}
              disabled={
                (step === 'need' && !optionId) ||
                (step === 'vehicle' &&
                  (!selectedVehicleId || vehicles.length === 0))
              }
            />
          ) : (
            <PrimaryButton
              label={pricing.ctaLabel}
              onPress={() => {
                void onSubmit();
              }}
              disabled={submitting}
            />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  progress: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressDot: {
    flex: 1,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  section: {
    gap: spacing.md,
  },
  options: {
    gap: spacing.sm,
  },
  vehicleList: {
    gap: spacing.sm,
  },
  emptyVehicle: {
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  backLink: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
