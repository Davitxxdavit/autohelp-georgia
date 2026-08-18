import { ServiceOptionCard as FlowServiceOptionCard } from '@/features/services/flow/ServiceOptionCard';

import { formatEstimatedPrice } from '../mock';
import type { BatteryOption } from '../types';

export function ServiceOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: BatteryOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <FlowServiceOptionCard
      title={option.title}
      subtitle={option.subtitle}
      priceLabel={formatEstimatedPrice(option)}
      selected={selected}
      onSelect={onSelect}
    />
  );
}
