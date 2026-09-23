'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getMessage } from '../i18n';
import {
  currentMonth,
  formatMonthLabel,
  formatShortMonthLabel,
  isSameMonth,
  monthRange,
  shiftMonth,
  type SelectedMonth,
} from '../util/month.util';

type SelectedMonthContextValue = {
  /** Selected year + human month (1–12). */
  selectedMonth: SelectedMonth;
  /** First day of the selected month, `YYYY-MM-DD`. */
  monthStart: string;
  /** Last day of the selected month, `YYYY-MM-DD`. */
  monthEnd: string;
  /** Long label, e.g. `Setembro 2026`. */
  monthLabel: string;
  /** Short label, e.g. `set/2026`. */
  shortMonthLabel: string;
  isCurrentMonth: boolean;
  selectMonth: (next: SelectedMonth) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
};

type SelectedMonthProviderProps = {
  children: React.ReactNode;
  defaultMonth?: SelectedMonth;
};

const SelectedMonthContext = createContext<SelectedMonthContextValue | null>(null);

/**
 * Global selected month for the private area. Intentionally NOT persisted:
 * reloading the app goes back to the current month.
 */
export function SelectedMonthProvider({ children, defaultMonth }: SelectedMonthProviderProps) {
  const [selectedMonth, setSelectedMonth] = useState<SelectedMonth>(() => defaultMonth ?? currentMonth());

  const selectMonth = useCallback((next: SelectedMonth) => {
    setSelectedMonth({ year: next.year, month: next.month });
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth((prev) => shiftMonth(prev, -1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((prev) => shiftMonth(prev, 1));
  }, []);

  const goToCurrentMonth = useCallback(() => {
    setSelectedMonth(currentMonth());
  }, []);

  const value = useMemo(() => {
    const { from, to } = monthRange(selectedMonth);

    return {
      selectedMonth,
      monthStart: from,
      monthEnd: to,
      monthLabel: formatMonthLabel(selectedMonth),
      shortMonthLabel: formatShortMonthLabel(selectedMonth),
      isCurrentMonth: isSameMonth(selectedMonth, currentMonth()),
      selectMonth,
      goToPreviousMonth,
      goToNextMonth,
      goToCurrentMonth,
    };
  }, [selectedMonth, selectMonth, goToPreviousMonth, goToNextMonth, goToCurrentMonth]);

  return <SelectedMonthContext.Provider value={value}>{children}</SelectedMonthContext.Provider>;
}

export function useSelectedMonthContext() {
  const context = useContext(SelectedMonthContext);
  if (!context) {
    throw new Error(getMessage('SELECTED_MONTH_CONTEXT_PROVIDER_REQUIRED'));
  }
  return context;
}
