import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { ServiceIcon } from '@/components/automotive/ServiceIcon';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { Surface } from '@/components/ui/Surface';
import { SERVICE_ICON_KIND } from '@/constants/serviceIcons';
import { getServiceById, isServiceId } from '@/constants/services';
import { LocationCard } from '@/features/requests/components/LocationCard';
import { OptionChip } from '@/features/requests/components/OptionChip';
import { RequestSummary } from '@/features/requests/components/RequestSummary';
import {
  ESTIMATED_PRICE,
  MOCK_LOCATION_LABEL,
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
import { typography } from '@/theme/typography';

export default function RequestServiceScreen() {
  const router = useRouter();
  const { service: serviceParam } = useLocalSearchParams<{ service: string }>();
  const serviceId = typeof serviceParam === 'string' ? serviceParam : '';
  const service = isServiceId(serviceId) ? getServiceById(serviceId) : undefined;
  const { vehicles, primaryVehicle, ready } = useVehicles();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [optionId, setOptionId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (primaryVehicle && !selectedVehicleId) {
      setSelectedVehicleId(primaryVehicle.id);
    }
  }, [primaryVehicle, selectedVehicleId]);

  const question = service ? SERVICE_QUESTIONS[service.id] : null;
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const estimatedPrice = service ? ESTIMATED_PRICE[service.id] : '—';

  const problemLabel = useMemo(() => {
    if (!question) return '—';
    if (question.mode === 'notes') return notes.trim() || '—';
    if (question.mode === 'location_focus') return MOCK_LOCATION_LABEL;
    const option = question.options.find((item) => item.id === optionId);
    return option?.label ?? '—';
  }, [notes, optionId, question]);

  const canSubmit = Boolean(
    service &&
      selectedVehicle &&
      (question?.mode === 'location_focus' ||
        (question?.mode === 'notes' && notes.trim().length > 0) ||
        (question?.mode === 'options' && optionId)),
  );

  const onSubmit = async () => {
    if (!service || !selectedVehicle || !canSubmit || submitting) {
      setFormError('შეავსე ყველა სავალდებულო ველი');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      // MOCK — local draft only. No mechanic matching / backend.
      const request = await createDraftRequest({
        vehicleId: selectedVehicle.id,
        serviceId: service.id,
        details: problemLabel,
        locationLabel: MOCK_LOCATION_LABEL,
        estimatedPriceLabel: estimatedPrice,
      });

      router.replace({
        pathname: '/request/success',
        params: { requestId: request.id },
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!service || !question) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <AppText variant="body" color="textSecondary">
          სერვისი ვერ მოიძებნა
        </AppText>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: service.title }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Surface elevated padded style={styles.hero}>
            <ServiceIcon kind={SERVICE_ICON_KIND[service.id]} size={28} />
            <View style={styles.heroCopy}>
              <AppText variant="h3">{service.title}</AppText>
              <AppText variant="caption" color="textSecondary">
                {service.description}
              </AppText>
            </View>
          </Surface>

          <View style={styles.section}>
            <AppText variant="h3">რომელი მანქანისთვის გჭირდება დახმარება?</AppText>
            {!ready ? (
              <AppText variant="caption" color="textMuted">
                იტვირთება…
              </AppText>
            ) : vehicles.length === 0 ? (
              <Surface elevated padded style={styles.emptyVehicle}>
                <AppText variant="bodyMedium">ჯერ მანქანა არ დაგიმატებია</AppText>
                <PrimaryButton
                  label="მანქანის დამატება"
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

          <View style={styles.section}>
            <AppText variant="h3">{question.prompt}</AppText>
            {question.mode === 'options' ? (
              <View style={styles.options}>
                {question.options.map((option) => (
                  <OptionChip
                    key={option.id}
                    label={option.label}
                    selected={optionId === option.id}
                    onPress={() => setOptionId(option.id)}
                  />
                ))}
              </View>
            ) : null}
            {question.mode === 'notes' ? (
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={question.placeholder}
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
                style={styles.notes}
                accessibilityLabel={question.prompt}
              />
            ) : null}
            {question.mode === 'location_focus' ? (
              <AppText variant="body" color="textSecondary">
                აირჩიე მდებარეობა ქვემოთ. რეალური GPS შემდეგ ეტაპზე დაემატება.
              </AppText>
            ) : null}
          </View>

          <LocationCard cityLabel={MOCK_LOCATION_LABEL} />

          {selectedVehicle ? (
            <RequestSummary
              vehicleLabel={vehicleTitle(selectedVehicle)}
              vehicleMeta={vehicleSubtitle(selectedVehicle)}
              serviceLabel={service.title}
              problemLabel={problemLabel}
              locationLabel={MOCK_LOCATION_LABEL}
              estimatedPriceLabel={estimatedPrice}
            />
          ) : null}

          {formError ? (
            <AppText variant="caption" color="danger">
              {formError}
            </AppText>
          ) : null}

          <PrimaryButton
            label="დახმარების გამოძახება"
            onPress={() => {
              void onSubmit();
            }}
            disabled={submitting || !canSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
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
  vehicleList: {
    gap: spacing.sm,
  },
  emptyVehicle: {
    gap: spacing.md,
  },
  options: {
    gap: spacing.sm,
  },
  notes: {
    minHeight: 120,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
