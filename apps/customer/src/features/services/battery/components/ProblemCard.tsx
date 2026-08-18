import { ProblemCard as FlowProblemCard } from '@/features/services/flow/ProblemCard';

import type { BatteryProblem } from '../types';

export function ProblemCard({
  problem,
  selected,
  onSelect,
}: {
  problem: BatteryProblem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <FlowProblemCard
      title={problem.title}
      emoji={problem.emoji}
      selected={selected}
      onSelect={onSelect}
    />
  );
}
