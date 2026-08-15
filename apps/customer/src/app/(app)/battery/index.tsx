import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { BatteryHero } from '@/features/services/battery/components/BatteryHero';
import { BatteryScreenHeader } from '@/features/services/battery/components/BatteryScreenHeader';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { ServiceOptionCard } from '@/features/services/battery/components/ServiceOptionCard';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { BATTERY_OPTIONS } from '@/features/services/battery/mock';
import type { BatteryOptionId } from '@/features/services/battery/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BatteryServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { draft, setOption } = useBatteryFlow();
  const [selected, setSelected] = useState<BatteryOptionId | null>(
    draft.optionId,
  );

  return (
    <View style={styles.screen}>
      <BatteryScreenHeader
        title="Battery Assistance"
        subtitle="Roadside help for a dead or failing battery"
      />
      <FadeIn>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <BatteryHero />
          <AppText variant="label" color="textMuted">
            Service
          </AppText>
          <View style={styles.list}>
            {BATTERY_OPTIONS.map((option) => (
              <ServiceOptionCard
                key={option.id}
                option={option}
                selected={selected === option.id}
                onSelect={() => {
                  setSelected(option.id);
                  setOption(option.id);
                }}
              />
            ))}
          </View>
          <AppText variant="caption" color="textMuted">
            Prices shown are mock estimates for this build. Final pricing will
            come from the service catalog later.
          </AppText>
          <PrimaryButton
            label="Continue"
            disabled={!selected}
            onPress={() => {
              if (!selected) return;
              router.push('/battery/vehicle');
            }}
          />
        </ScrollView>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
});
