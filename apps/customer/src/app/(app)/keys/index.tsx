import { StyleSheet, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppText } from '@/components/ui/AppText';
import { FormField } from '@/features/vehicles/components/FormField';
import { FadeIn } from '@/features/services/flow/FadeIn';
import { ProblemCard } from '@/features/services/flow/ProblemCard';
import { ServiceHero } from '@/features/services/flow/ServiceHero';
import { ServiceScreenHeader } from '@/features/services/flow/ServiceScreenHeader';
import { ServiceScreenScaffold } from '@/features/services/flow/ServiceScreenScaffold';
import { useKeysFlow } from '@/features/services/keys/KeysFlowProvider';
import { KEYS_PROBLEMS } from '@/features/services/keys/mock';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function KeysServiceScreen() {
  const router = useRouter();
  const { draft, setProblem, setDetails } = useKeysFlow();

  return (
    <View style={styles.screen}>
      <ServiceScreenHeader
        title="Auto Key"
        subtitle="Locked out or key issues"
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
                router.push('/keys/vehicle' as Href);
              }}
            />
          }
        >
          <ServiceHero
            kind="locksmith"
            label="Auto Key"
            description="A locksmith comes to you for lockouts, lost keys, and keys that no longer work."
          />
          <AppText variant="label" color="textMuted">
            What happened?
          </AppText>
          <View style={styles.grid}>
            {KEYS_PROBLEMS.map((problem) => (
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
            placeholder="Anything the locksmith should know…"
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
