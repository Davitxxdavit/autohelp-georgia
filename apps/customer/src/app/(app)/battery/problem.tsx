import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { FormField } from '@/features/vehicles/components/FormField';
import { BatteryScreenHeader } from '@/features/services/battery/components/BatteryScreenHeader';
import { BatteryScreenScaffold } from '@/features/services/battery/components/BatteryScreenScaffold';
import { FadeIn } from '@/features/services/battery/components/FadeIn';
import { ProblemCard } from '@/features/services/battery/components/ProblemCard';
import { useBatteryFlow } from '@/features/services/battery/BatteryFlowProvider';
import { BATTERY_PROBLEMS } from '@/features/services/battery/mock';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BatteryProblemScreen() {
  const router = useRouter();
  const { draft, setProblem, setDetails } = useBatteryFlow();

  return (
    <View style={styles.screen}>
      <BatteryScreenHeader
        title="What happened?"
        subtitle="Choose the closest match"
      />
      <FadeIn>
        <BatteryScreenScaffold
          keyboard
          contentContainerStyle={styles.content}
          footer={
            <PrimaryButton
              label="Continue"
              disabled={!draft.problemId}
              onPress={() => {
                if (!draft.problemId) return;
                router.push('/battery/location');
              }}
            />
          }
        >
          <View style={styles.grid}>
            {BATTERY_PROBLEMS.map((problem) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                selected={draft.problemId === problem.id}
                onSelect={() => setProblem(problem.id)}
              />
            ))}
          </View>
          <FormField
            label="Additional details (optional)"
            value={draft.details}
            onChangeText={setDetails}
            placeholder="Anything the specialist should know…"
            multiline
            textAlignVertical="top"
            style={styles.notes}
          />
        </BatteryScreenScaffold>
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
    flexGrow: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  notes: {
    minHeight: 96,
  },
});
