import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type PhoneInputProps = {
  countryCode: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

/** Georgian mobile: keep digits only, max 9 (5XXXXXXXX) */
export function normalizeGePhone(input: string): string {
  return input.replace(/\D/g, '').slice(0, 9);
}

export function isValidGeMobile(phone: string): boolean {
  return /^5\d{8}$/.test(phone);
}

export function formatDisplayPhone(phone: string, countryCode: string): string {
  return `${countryCode} ${phone}`;
}

export function PhoneInput({
  countryCode,
  value,
  onChangeText,
  placeholder,
}: PhoneInputProps) {
  return (
    <View style={styles.row}>
      <View style={styles.code}>
        <AppText variant="bodyMedium">{countryCode}</AppText>
      </View>
      <TextInput
        value={value}
        onChangeText={(text) => onChangeText(normalizeGePhone(text))}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        maxLength={9}
        accessibilityLabel="Phone number"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  code: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
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
});
