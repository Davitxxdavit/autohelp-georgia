import { useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const OTP_LENGTH = 6;

export type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function OtpInput({ value, onChange }: OtpInputProps) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  const updateAt = (index: number, char: string) => {
    const next = digits.map((d, i) => (i === index ? char : d));
    const joined = next.join('').replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(joined);
  };

  const handleChange = (index: number, text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length === 0) {
      updateAt(index, '');
      return;
    }

    // Paste / autofill of full code
    if (cleaned.length > 1) {
      onChange(cleaned.slice(0, OTP_LENGTH));
      const focusIndex = Math.min(cleaned.length, OTP_LENGTH) - 1;
      inputs.current[focusIndex]?.focus();
      return;
    }

    updateAt(index, cleaned);
    if (index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (event.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row} accessibilityLabel="SMS code input">
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputs.current[index] = ref;
          }}
          value={digit}
          onChangeText={(text) => handleChange(index, text)}
          onKeyPress={(event) => handleKeyPress(index, event)}
          keyboardType="number-pad"
          textContentType={index === 0 ? 'oneTimeCode' : 'none'}
          maxLength={OTP_LENGTH}
          selectTextOnFocus
          accessibilityLabel={`Digit ${index + 1}`}
          style={[styles.cell, digit ? styles.cellFilled : null]}
        />
      ))}
    </View>
  );
}

export const MOCK_OTP_CODE = '123456';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  cell: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 52,
    textAlign: 'center',
    ...typography.h3,
    color: colors.textPrimary,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellFilled: {
    borderColor: colors.primary,
  },
});
