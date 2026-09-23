'use client';

import type { CashFlowWindow } from '@poupig/transaction';
import { FilterPill } from '@/shared/components/ui/filter-pill';
import { CASH_FLOW_WINDOW_OPTIONS } from '../data/cash-flow-window';

export type CashFlowWindowSelectorProps = {
  value: CashFlowWindow;
  onChange: (months: CashFlowWindow) => void;
};

/** Always visible pills with the report windows; the current one is announced as pressed. */
export function CashFlowWindowSelectorComponent({ value, onChange }: CashFlowWindowSelectorProps) {
  return (
    <div role="group" aria-label="Período do relatório" className="flex flex-wrap items-center gap-2">
      {CASH_FLOW_WINDOW_OPTIONS.map((option) => (
        <FilterPill
          key={option.value}
          active={option.value === value}
          aria-label={`Últimos ${option.label}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </FilterPill>
      ))}
    </div>
  );
}
