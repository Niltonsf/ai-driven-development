'use client';

import { useState } from 'react';
import { CalendarCheck, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { useSelectedMonth } from '@/shared/hooks/selected-month.hook';
import { cn } from '@/shared/lib/class-name.util';
import {
  MONTH_SHORT_LABELS,
  currentMonth,
  formatMonthLabel,
  isSameMonth,
  type SelectedMonth,
} from '@/shared/util/month.util';

const MONTH_CELL_BASE_CLASS =
  'relative flex h-10 items-center justify-center rounded-xl border text-sm capitalize transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none';
/** Same visual language as the active item of the sidebar menu. */
const MONTH_CELL_ACTIVE_CLASS =
  'border-white/10 bg-linear-to-r from-white/10 via-white/6 to-zinc-800/70 font-medium text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';
const MONTH_CELL_INACTIVE_CLASS = 'border-transparent text-zinc-300 hover:bg-white/6 hover:text-zinc-100';

/**
 * Global month selector for the shell header: previous/next arrows plus a
 * panel with year navigation and a 12-month grid. Presentation only — the
 * state lives in `SelectedMonthProvider`.
 */
export function MonthPicker() {
  const {
    selectedMonth,
    monthLabel,
    shortMonthLabel,
    isCurrentMonth,
    selectMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
  } = useSelectedMonth();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => selectedMonth.year);
  const today = currentMonth();

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setViewYear(selectedMonth.year);
    }
    setOpen(next);
  };

  const handleSelect = (month: SelectedMonth) => {
    selectMonth(month);
    setOpen(false);
  };

  const handleGoToCurrentMonth = () => {
    goToCurrentMonth();
    setOpen(false);
  };

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0"
        onClick={goToPreviousMonth}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-28 min-w-0 justify-between gap-1.5 px-2.5 sm:w-40 sm:px-3"
            aria-label={`Selecionar mês: ${monthLabel}`}
          >
            <span className="hidden truncate sm:inline">{monthLabel}</span>
            <span className="truncate sm:hidden">{shortMonthLabel}</span>
            <ChevronDown className="size-4 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-64 p-3">
          <div className="mb-2 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setViewYear((year) => year - 1)}
              aria-label="Ano anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-semibold tabular-nums" aria-live="polite">
              {viewYear}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setViewYear((year) => year + 1)}
              aria-label="Ano seguinte"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_SHORT_LABELS.map((label, index) => {
              const candidate: SelectedMonth = { year: viewYear, month: index + 1 };
              const selected = isSameMonth(candidate, selectedMonth);
              const current = isSameMonth(candidate, today);

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleSelect(candidate)}
                  aria-pressed={selected}
                  aria-current={current ? 'date' : undefined}
                  aria-label={formatMonthLabel(candidate)}
                  className={cn(MONTH_CELL_BASE_CLASS, selected ? MONTH_CELL_ACTIVE_CLASS : MONTH_CELL_INACTIVE_CLASS)}
                >
                  {label}
                  {current ? (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-amber-400"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {!isCurrentMonth ? (
            <div className="mt-3 border-t border-border pt-3">
              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={handleGoToCurrentMonth}>
                <CalendarCheck className="size-4" />
                Mês atual
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0"
        onClick={goToNextMonth}
        aria-label="Mês seguinte"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
