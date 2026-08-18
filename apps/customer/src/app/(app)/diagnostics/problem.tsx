import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { FormField } from '@/features/vehicles/components/FormField';
import { FadeIn } from '@/features/services/flow/FadeIn';
import { ProblemCard } from '@/features/services/flow/ProblemCard';
import { ServiceScreenHeader } from '@/features/services/flow/ServiceScreenHeader';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import { useDiagnosticsFlow } from '@/features/services/diagnostics/DiagnosticsFlowProvider';
import { DIAGNOSTICS_PROBLEMS } from '@/features/services/diagnostics/mock';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function DiagnosticsProblemScreen() {
  const router = useRouter();
  const { draft, setProblem, setDetails } = useDiagnosticsFlow();

  return (
    <View style={styles.screen}>
      <ServiceScreenHeader
        title="What happened?"
        subtitle="Choose the closest match"
      />
      <FadeIn>
        <ServiceScreenScaffold
          keyboard
          contentContainerStyle={styles.content}
          footer={
            <PrimaryButton
              label="Continue"
              disabled={!draft.problemId}
              onPress={() => {
                if (!draft.problemId) return;
                router.push('/diagnostics/location' as Href);
              }}
            />
          }
        >
          <View style={styles.grid}>
            {DIAGNOSTICS_PROBLEMS.map((problem) => (
              <ProblemCard
                key={problem.id}
                title={problem.title}
                emoji={problem.emoji}
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
