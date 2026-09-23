import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Month utilities for the globally selected month.
 *
 * IMPORTANT: `month` is the HUMAN month, from 1 (January) to 12 (December) —
 * NOT the 0-based index used by `Date#getMonth()`. Convert only at the edges
 * (`new Date(year, month - 1, 1)`), never store the 0-based index.
 *
 * Dates are always built in local time from year/month/day numbers. Never use
 * `toISOString()` on a local `Date`: in negative UTC offsets it shifts the day.
 */
export type SelectedMonth = {
  year: number;
  /** Human month: 1 (January) to 12 (December). */
  month: number;
};

export type MonthRange = {
  /** First day of the month, `YYYY-MM-DD`. */
  from: string;
  /** Last day of the month, `YYYY-MM-DD`. */
  to: string;
};

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

function toLocalFirstDay({ year, month }: SelectedMonth): Date {
  return new Date(year, month - 1, 1);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Current month according to the browser clock (local time). */
export function currentMonth(): SelectedMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** First and last day of the month as `YYYY-MM-DD`, without timezone shifts. */
export function monthRange({ year, month }: SelectedMonth): MonthRange {
  // Day 0 of the next month is the last day of this one; the human month is already the next month's index.
  const lastDay = new Date(year, month, 0).getDate();
  const prefix = `${pad(year, 4)}-${pad(month)}`;

  return { from: `${prefix}-01`, to: `${prefix}-${pad(lastDay)}` };
}

/** Stable `YYYY-MM` key, useful to detect month changes. */
export function monthKey({ year, month }: SelectedMonth): string {
  return `${pad(year, 4)}-${pad(month)}`;
}

/**
 * Inverse of `monthKey`: `'2026-09'` → `{ year: 2026, month: 9 }` (human month).
 * Reads only the text and integers, never a `Date`, so no time zone can shift the
 * month. Expects a well-formed `YYYY-MM` key, such as the ones returned by the API.
 */
export function parseMonthKey(key: string): SelectedMonth {
  const [year = '', month = ''] = key.split('-');

  return { year: Number.parseInt(year, 10), month: Number.parseInt(month, 10) };
}

/** Moves the month by `delta` months (negative goes back), rolling the year over. */
export function shiftMonth({ year, month }: SelectedMonth, delta: number): SelectedMonth {
  const absoluteIndex = year * 12 + (month - 1) + delta;

  return { year: Math.floor(absoluteIndex / 12), month: (((absoluteIndex % 12) + 12) % 12) + 1 };
}

export function isSameMonth(a: SelectedMonth, b: SelectedMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

/** Long label with the first letter capitalized, e.g. `Setembro 2026`. */
export function formatMonthLabel(month: SelectedMonth): string {
  return capitalize(format(toLocalFirstDay(month), 'MMMM yyyy', { locale: ptBR }));
}

/** Short label for narrow screens, e.g. `set/2026`. */
export function formatShortMonthLabel(month: SelectedMonth): string {
  return format(toLocalFirstDay(month), 'MMM/yyyy', { locale: ptBR });
}

/** The 12 short month labels in pt-BR (`jan` … `dez`), index 0 is month 1. */
export const MONTH_SHORT_LABELS: readonly string[] = Object.freeze(
  Array.from({ length: 12 }, (_, index) => format(new Date(2000, index, 1), 'MMM', { locale: ptBR })),
);
