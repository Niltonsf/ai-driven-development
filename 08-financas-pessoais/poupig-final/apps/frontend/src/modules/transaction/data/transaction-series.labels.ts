import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayOfWeek, FrequencyUnit, SeriesKind, type RecurrenceRule } from '@poupig/transaction';

/**
 * The labels are declared over the domain sets, so a new kind, unit or week day
 * breaks the build until it gets its own label.
 */
export const SERIES_KIND_LABELS: Record<SeriesKind, string> = {
  [SeriesKind.CLOSED]: 'Parcelamento',
  [SeriesKind.OPEN]: 'Recorrência',
};

export const FREQUENCY_UNIT_LABELS: Record<FrequencyUnit, string> = {
  [FrequencyUnit.WEEK]: 'Semanal',
  [FrequencyUnit.MONTH]: 'Mensal',
  [FrequencyUnit.YEAR]: 'Anual',
};

/** Plural of each unit for `A cada N ...`; declared over the domain set like the labels above. */
const FREQUENCY_UNIT_PLURALS: Record<FrequencyUnit, string> = {
  [FrequencyUnit.WEEK]: 'semanas',
  [FrequencyUnit.MONTH]: 'meses',
  [FrequencyUnit.YEAR]: 'anos',
};

/** Frequency of a recurrence rule: `Semanal`/`Mensal`/`Anual` with interval 1, `A cada 2 meses` above it. */
export function formatRecurrenceFrequency(rule: RecurrenceRule): string {
  if (rule.interval <= 1) return FREQUENCY_UNIT_LABELS[rule.unit];
  return `A cada ${rule.interval} ${FREQUENCY_UNIT_PLURALS[rule.unit]}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** 1 January 2024 is a Monday, so the ISO day `n` is simply the day `n` of that month. */
function weekDayLabel(weekDay: DayOfWeek): string {
  return capitalize(format(new Date(2024, 0, weekDay), 'EEEE', { locale: ptBR }));
}

function monthLabel(month: number): string {
  return capitalize(format(new Date(2024, month - 1, 1), 'MMMM', { locale: ptBR }));
}

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: weekDayLabel(DayOfWeek.MONDAY),
  [DayOfWeek.TUESDAY]: weekDayLabel(DayOfWeek.TUESDAY),
  [DayOfWeek.WEDNESDAY]: weekDayLabel(DayOfWeek.WEDNESDAY),
  [DayOfWeek.THURSDAY]: weekDayLabel(DayOfWeek.THURSDAY),
  [DayOfWeek.FRIDAY]: weekDayLabel(DayOfWeek.FRIDAY),
  [DayOfWeek.SATURDAY]: weekDayLabel(DayOfWeek.SATURDAY),
  [DayOfWeek.SUNDAY]: weekDayLabel(DayOfWeek.SUNDAY),
};

/** Indexed by the human month (1..12), the same numbering the recurrence rule uses. */
export const MONTH_LABELS: Record<number, string> = {
  1: monthLabel(1),
  2: monthLabel(2),
  3: monthLabel(3),
  4: monthLabel(4),
  5: monthLabel(5),
  6: monthLabel(6),
  7: monthLabel(7),
  8: monthLabel(8),
  9: monthLabel(9),
  10: monthLabel(10),
  11: monthLabel(11),
  12: monthLabel(12),
};
