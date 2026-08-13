import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { FormField } from '@/features/vehicles/components/FormField';
import { OptionChip } from '@/features/requests/components/OptionChip';
import {
  CURRENT_YEAR,
  MIN_VEHICLE_YEAR,
  fuelLabel,
} from '@/features/vehicles/display';
import { useVehicles } from '@/features/vehicles/VehiclesProvider';
import { FUEL_TYPES, type FuelType } from '@/features/vehicles/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type FormErrors = {
  make?: string;
  model?: string;
  year?: string;
  fuel?: string;
};

export default function AddVehicleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { getById, add, update } = useVehicles();
  const editing = typeof editId === 'string' ? getById(editId) : undefined;

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engine, setEngine] = useState('');
  const [fuel, setFuel] = useState<FuelType | null>(null);
  const [nickname, setNickname] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  useEffect(() => {
    if (!editing || hydratedId === editing.id) return;
    setMake(editing.make);
    setModel(editing.model);
    setYear(String(editing.year));
    setEngine(editing.engine ?? '');
    setFuel(editing.fuel);
    setNickname(editing.nickname ?? '');
    setIsPrimary(editing.isPrimary);
    setHydratedId(editing.id);
  }, [editing, hydratedId]);

  const title = editing ? 'მანქანის რედაქტირება' : 'მანქანის დამატება';

  const yearNumber = useMemo(() => Number.parseInt(year, 10), [year]);
  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!make.trim()) next.make = 'მარკა სავალდებულოა';
    if (!model.trim()) next.model = 'მოდელი სავალდებულოა';
    if (
      !year.trim() ||
      Number.isNaN(yearNumber) ||
      yearNumber < MIN_VEHICLE_YEAR ||
      yearNumber > CURRENT_YEAR + 1
    ) {
      next.year = `წელი უნდა იყოს ${MIN_VEHICLE_YEAR}–${CURRENT_YEAR + 1}`;
    }
    if (!fuel) next.fuel = 'აირჩიე საწვავის ტიპი';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate() || !fuel || saving) return;
    setSaving(true);
    try {
      const payload = {
        make,
        model,
        year: yearNumber,
        engine,
        fuel,
        nickname,
        isPrimary,
      };
      if (editing) {
        await update(editing.id, payload);
        router.replace({
          pathname: '/vehicle/[id]',
          params: { id: editing.id },
        });
      } else {
        const created = await add(payload);
        router.replace({
          pathname: '/vehicle/[id]',
          params: { id: created.id },
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title, headerShown: true }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing['2xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormField
            label="მარკა"
            required
            value={make}
            onChangeText={setMake}
            placeholder="BMW"
            autoCapitalize="words"
            error={errors.make}
          />
          <FormField
            label="მოდელი"
            required
            value={model}
            onChangeText={setModel}
            placeholder="530"
            autoCapitalize="words"
            error={errors.model}
          />
          <FormField
            label="წელი"
            required
            value={year}
            onChangeText={(text) => setYear(text.replace(/\D/g, '').slice(0, 4))}
            placeholder="2015"
            keyboardType="number-pad"
            error={errors.year}
          />
          <FormField
            label="ძრავი"
            value={engine}
            onChangeText={setEngine}
            placeholder="2.0"
            autoCapitalize="none"
          />

          <View style={styles.field}>
            <AppText variant="caption" color="textMuted">
              საწვავის ტიპი *
            </AppText>
            <View style={styles.fuels}>
              {FUEL_TYPES.map((type) => (
                <OptionChip
                  key={type}
                  label={fuelLabel(type)}
                  selected={fuel === type}
                  onPress={() => {
                    setFuel(type);
                    if (errors.fuel) {
                      setErrors((prev) => ({ ...prev, fuel: undefined }));
                    }
                  }}
                />
              ))}
            </View>
            {errors.fuel ? (
              <AppText variant="caption" color="danger">
                {errors.fuel}
              </AppText>
            ) : null}
          </View>

          <FormField
            label="სახელი / nickname"
            value={nickname}
            onChangeText={setNickname}
            placeholder='მაგ. "ჩემი BMW"'
          />

          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <AppText variant="bodyMedium">ძირითადი მანქანა</AppText>
              <AppText variant="caption" color="textMuted">
                გამოძახებისას ნაგულისხმევად აირჩევა
              </AppText>
            </View>
            <Switch
              value={isPrimary}
              onValueChange={setIsPrimary}
              trackColor={{ false: colors.border, true: colors.primaryMuted }}
              thumbColor={isPrimary ? colors.primary : colors.textSecondary}
            />
          </View>

          <PrimaryButton
            label={editing ? 'შენახვა' : 'მანქანის დამატება'}
            onPress={() => {
              void onSubmit();
            }}
            disabled={saving}
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
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  field: {
    gap: spacing.sm,
  },
  fuels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  switchCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
});
