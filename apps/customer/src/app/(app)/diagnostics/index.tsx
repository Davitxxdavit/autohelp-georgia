import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { FadeIn } from '@/features/services/flow/FadeIn';
import { ServiceHero } from '@/features/services/flow/ServiceHero';
import { ServiceOptionCard } from '@/features/services/flow/ServiceOptionCard';
import { ServiceScreenHeader } from '@/features/services/flow/ServiceScreenHeader';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import { useDiagnosticsFlow } from '@/features/services/diagnostics/DiagnosticsFlowProvider';
import {
  DIAGNOSTICS_OPTIONS,
  formatEstimatedPrice,
} from '@/features/services/diagnostics/mock';
import type { DiagnosticsOptionId } from '@/features/services/diagnostics/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function DiagnosticsServiceScreen() {
  const router = useRouter();
  const { draft, setOption } = useDiagnosticsFlow();
  const [selected, setSelected] = useState<DiagnosticsOptionId | null>(
    draft.optionId,
  );

  return (
    <View style={styles.screen}>
      <ServiceScreenHeader
        title="Computer diagnostics"
        subtitle="On-site scan for warning lights and engine issues"
      />
      <FadeIn>
        <ServiceScreenScaffold
          contentContainerStyle={styles.content}
          footer={
            <PrimaryButton
              label="Continue"
              disabled={!selected}
              onPress={() => {
                if (!selected) return;
                router.push('/diagnostics/vehicle' as Href);
              }}
            />
          }
        >
          <ServiceHero
            kind="diagnostics"
            label="Computer diagnostics"
            description="A specialist comes to you with a scan tool and reads the car’s systems."
          />
          <AppText variant="label" color="textMuted">
            Service
          </AppText>
          <View style={styles.list}>
            {DIAGNOSTICS_OPTIONS.map((option) => (
              <ServiceOptionCard
                key={option.id}
                title={option.title}
                subtitle={option.subtitle}
                priceLabel={formatEstimatedPrice(option)}
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
        </ServiceScreenScaffold>
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
