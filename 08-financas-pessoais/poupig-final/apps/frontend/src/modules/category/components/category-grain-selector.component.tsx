'use client';

import { FilterPill } from '@/shared/components/ui/filter-pill';
import {
  CATEGORY_SPENDING_GRAIN_LABELS,
  CATEGORY_SPENDING_GRAINS,
  type CategorySpendingGrain,
} from '../data/category-spending-slices';

export type CategoryGrainSelectorProps = {
  value: CategorySpendingGrain;
  onChange: (grain: CategorySpendingGrain) => void;
};

/** What each pill shows, for screen readers: the visible label alone does not say it. */
const GRAIN_ARIA_LABELS: Record<CategorySpendingGrain, string> = {
  category: 'Mostrar os gastos somados por categoria',
  subcategory: 'Mostrar os gastos de cada subcategoria',
};

/** Always visible pills with the grains of the report; the current one is announced as pressed. */
export function CategoryGrainSelectorComponent({ value, onChange }: CategoryGrainSelectorProps) {
  return (
    <div role="group" aria-label="Granularidade do relatório" className="flex flex-wrap items-center gap-2">
      {CATEGORY_SPENDING_GRAINS.map((grain) => (
        <FilterPill
          key={grain}
          active={grain === value}
          aria-label={GRAIN_ARIA_LABELS[grain]}
          onClick={() => onChange(grain)}
        >
          {CATEGORY_SPENDING_GRAIN_LABELS[grain]}
        </FilterPill>
      ))}
    </div>
  );
}
