import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import {
  DEFAULT_COUNTRY,
  capNationalDigits,
  digitsOnly,
  filterCountries,
  formatNationalNumber,
  getCountryOptions,
  resolvePhoneValue,
  tryParseInternational,
  type CountryCode,
  type CountryOption,
  type PhoneValue,
} from './phone';

export type PhoneNumberInputProps = {
  onChange: (value: PhoneValue) => void;
  defaultCountry?: CountryCode;
  error?: string | null;
  disabled?: boolean;
  placeholder?: string;
};

export function PhoneNumberInput({
  onChange,
  defaultCountry = DEFAULT_COUNTRY,
  error,
  disabled = false,
  placeholder = 'Phone number',
}: PhoneNumberInputProps) {
  const insets = useSafeAreaInsets();
  const countries = useMemo(() => getCountryOptions(), []);
  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [digits, setDigits] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected =
    countries.find((item) => item.iso === country) ?? countries[0];
  const display = formatNationalNumber(country, digits);
  const filtered = useMemo(
    () => filterCountries(search, countries),
    [countries, search],
  );

  const emit = (nextCountry: CountryCode, nextDigits: string) => {
    onChange(resolvePhoneValue(nextCountry, nextDigits));
  };

  const applyDigits = (nextCountry: CountryCode, raw: string) => {
    const international = tryParseInternational(raw);
    if (international) {
      const capped = capNationalDigits(
        international.country,
        international.digits,
      );
      setCountry(international.country);
      setDigits(capped);
      emit(international.country, capped);
      return;
    }
    const capped = capNationalDigits(nextCountry, digitsOnly(raw));
    setDigits(capped);
    emit(nextCountry, capped);
  };

  const onSelectCountry = (option: CountryOption) => {
    const capped = capNationalDigits(option.iso, digits);
    setCountry(option.iso);
    setDigits(capped);
    emit(option.iso, capped);
    setPickerOpen(false);
    setSearch('');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Country code ${selected.flag} ${selected.callingCode}`}
          disabled={disabled}
          onPress={() => setPickerOpen(true)}
          style={[
            styles.code,
            error ? styles.invalid : null,
            disabled ? styles.disabled : null,
          ]}
        >
          <AppText variant="bodyMedium">
            {selected.flag} {selected.callingCode}
          </AppText>
          <AppText variant="caption" color="textMuted">
            ▼
          </AppText>
        </Pressable>
        <TextInput
          value={display}
          onChangeText={(text) => applyDigits(country, text)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          autoCorrect={false}
          autoCapitalize="none"
          importantForAutofill="yes"
          editable={!disabled}
          accessibilityLabel="Phone number"
          style={[
            styles.input,
            error ? styles.invalid : null,
            disabled ? styles.disabled : null,
          ]}
        />
      </View>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View
          style={[
            styles.modal,
            {
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <AppText variant="h3">Select country</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close country picker"
              onPress={() => setPickerOpen(false)}
            >
              <AppText variant="button" color="primary">
                Done
              </AppText>
            </Pressable>
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search country or code"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search countries"
            style={styles.search}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.iso}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.name} ${item.callingCode}`}
                onPress={() => onSelectCountry(item)}
                style={styles.option}
              >
                <AppText variant="bodyMedium">
                  {item.flag}  {item.name}
                </AppText>
                <AppText variant="body" color="textSecondary">
                  {item.callingCode}
                </AppText>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  code: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  invalid: {
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.55,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  search: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
