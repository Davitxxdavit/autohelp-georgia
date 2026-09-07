import { StyleSheet } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { openPhoneCall } from '@/lib/phone';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export function CallMechanicButton({
  phone,
}: {
  phone?: string | null;
}) {
  if (!phone) return null;
  return (
    <AnimatedPressable
      accessibilityLabel="Call mechanic"
      onPress={() => {
        void openPhoneCall(phone);
      }}
      style={styles.button}
    >
      <AppText variant="button" color="primary">
        Call mechanic
      </AppText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
