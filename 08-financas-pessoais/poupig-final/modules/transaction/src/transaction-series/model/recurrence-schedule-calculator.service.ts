import { FrequencyUnit } from './frequency-unit.enum';
import { RecurrenceRule } from './recurrence-rule';

/** A calendar date split into its parts, with `month` in the human 1..12 range. */
interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

/** One occurrence of a series: its base 0 index and its `YYYY-MM-DD` date. */
export interface OccurrenceInPeriod {
  index: number;
  date: string;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Where the occurrences of a series fall.
 *
 * Pure and deterministic: every date arrives and leaves in the `YYYY-MM-DD`
 * format and the whole arithmetic happens in UTC, so the same inputs produce the
 * same outputs in any time zone. The current date is never consulted.
 *
 * Precondition: the date and the rule are already valid — the entity validates
 * them before calling, and the form only calls with an approved rule.
 */
export class RecurrenceScheduleCalculator {
  /**
   * The first date greater than or equal to `startDate` that matches the anchor
   * of the rule. The start date is not, by itself, an occurrence.
   */
  static firstOccurrence(startDate: string, rule: RecurrenceRule): string {
    return RecurrenceScheduleCalculator.format(RecurrenceScheduleCalculator.first(startDate, rule));
  }

  /**
   * The occurrence of `index` (base 0, where 0 is the first one), walking by the
   * interval from the first occurrence. The clamp of a day that does not exist
   * in the target month never rewrites the anchor of the following occurrences.
   */
  static occurrenceAt(startDate: string, rule: RecurrenceRule, index: number): string {
    const first = RecurrenceScheduleCalculator.first(startDate, rule);

    if (rule.unit === FrequencyUnit.WEEK) {
      return RecurrenceScheduleCalculator.format(
        RecurrenceScheduleCalculator.addDays(first, 7 * rule.interval * index),
      );
    }

    if (rule.unit === FrequencyUnit.MONTH) {
      const monthIndex = RecurrenceScheduleCalculator.toMonthIndex(first) + rule.interval * index;
      return RecurrenceScheduleCalculator.format(
        RecurrenceScheduleCalculator.fromMonthIndex(monthIndex, rule.dayOfMonth),
      );
    }

    const year = first.year + rule.interval * index;
    return RecurrenceScheduleCalculator.format({
      year,
      month: rule.month,
      day: RecurrenceScheduleCalculator.clampDay(year, rule.month, rule.dayOfMonth),
    });
  }

  /** The last installment of a series of `installments` occurrences. */
  static lastOccurrence(startDate: string, rule: RecurrenceRule, installments: number): string {
    return RecurrenceScheduleCalculator.occurrenceAt(startDate, rule, installments - 1);
  }

  /**
   * The occurrences (index and date) whose date falls inside the inclusive
   * period `from`..`to`, in ascending index order. With `installments`, no index
   * `>= installments` is returned; with `endDate`, no date after it.
   *
   * The first index of the period is estimated from the distance in weeks,
   * months or years between the first occurrence and `from`, divided by the
   * interval — the series is never walked from index 0, so the cost depends on
   * how many occurrences the period has, not on how old the series is. Every
   * date still comes from `occurrenceAt`, so the month-end clamp lives in one
   * place only.
   */
  static occurrencesBetween(
    startDate: string,
    rule: RecurrenceRule,
    options: { from: string; to: string; endDate?: string | null; installments?: number | null },
  ): OccurrenceInPeriod[] {
    const { from, to, endDate, installments } = options;
    const first = RecurrenceScheduleCalculator.first(startDate, rule);
    if (RecurrenceScheduleCalculator.format(first) > to) return [];

    let index = RecurrenceScheduleCalculator.estimateIndex(first, from, rule);

    // The estimate may land one occurrence early because of the clamp and of the day inside the month.
    while (RecurrenceScheduleCalculator.occurrenceAt(startDate, rule, index) < from) {
      index++;
    }

    const occurrences: OccurrenceInPeriod[] = [];
    while (installments === undefined || installments === null || index < installments) {
      const date = RecurrenceScheduleCalculator.occurrenceAt(startDate, rule, index);
      if (date > to || (endDate && date > endDate)) break;

      occurrences.push({ index, date });
      index++;
    }

    return occurrences;
  }

  /**
   * The index of the first occurrence that may be `>= from`: never after it,
   * and at most one occurrence before it. `0` when `from` is not after the
   * first occurrence.
   */
  private static estimateIndex(first: CalendarDate, from: string, rule: RecurrenceRule): number {
    if (from <= RecurrenceScheduleCalculator.format(first)) return 0;

    const target = RecurrenceScheduleCalculator.parse(from);

    if (rule.unit === FrequencyUnit.WEEK) {
      const days = RecurrenceScheduleCalculator.daysBetween(first, target);
      return Math.ceil(days / (7 * rule.interval));
    }

    if (rule.unit === FrequencyUnit.MONTH) {
      const months =
        RecurrenceScheduleCalculator.toMonthIndex(target) - RecurrenceScheduleCalculator.toMonthIndex(first);
      return Math.max(0, Math.floor(months / rule.interval));
    }

    return Math.max(0, Math.floor((target.year - first.year) / rule.interval));
  }

  private static first(startDate: string, rule: RecurrenceRule): CalendarDate {
    const start = RecurrenceScheduleCalculator.parse(startDate);

    if (rule.unit === FrequencyUnit.WEEK) {
      const distance = (rule.weekDay - RecurrenceScheduleCalculator.isoWeekDay(start) + 7) % 7;
      return RecurrenceScheduleCalculator.addDays(start, distance);
    }

    if (rule.unit === FrequencyUnit.MONTH) {
      const candidate = RecurrenceScheduleCalculator.fromMonthIndex(
        RecurrenceScheduleCalculator.toMonthIndex(start),
        rule.dayOfMonth,
      );
      if (!RecurrenceScheduleCalculator.isBefore(candidate, start)) return candidate;

      // The next month, never `+ interval`: the interval counts from the first occurrence.
      return RecurrenceScheduleCalculator.fromMonthIndex(
        RecurrenceScheduleCalculator.toMonthIndex(start) + 1,
        rule.dayOfMonth,
      );
    }

    const candidate = {
      year: start.year,
      month: rule.month,
      day: RecurrenceScheduleCalculator.clampDay(start.year, rule.month, rule.dayOfMonth),
    };
    if (!RecurrenceScheduleCalculator.isBefore(candidate, start)) return candidate;

    const nextYear = start.year + 1;
    return {
      year: nextYear,
      month: rule.month,
      day: RecurrenceScheduleCalculator.clampDay(nextYear, rule.month, rule.dayOfMonth),
    };
  }

  private static parse(value: string): CalendarDate {
    const parts = value.split('-');
    return { year: Number(parts[0]), month: Number(parts[1]), day: Number(parts[2]) };
  }

  /** Whole days from `left` to `right`, both taken at midnight UTC. */
  private static daysBetween(left: CalendarDate, right: CalendarDate): number {
    const leftTime = Date.UTC(left.year, left.month - 1, left.day);
    const rightTime = Date.UTC(right.year, right.month - 1, right.day);
    return Math.round((rightTime - leftTime) / MILLISECONDS_PER_DAY);
  }

  private static format(date: CalendarDate): string {
    const year = String(date.year).padStart(4, '0');
    const month = String(date.month).padStart(2, '0');
    const day = String(date.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /** `YYYY-MM-DD` sorts lexicographically, so the strings compare the dates. */
  private static isBefore(left: CalendarDate, right: CalendarDate): boolean {
    return RecurrenceScheduleCalculator.format(left) < RecurrenceScheduleCalculator.format(right);
  }

  /** Day 0 of the following month is the last day of this one. */
  private static daysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  /** A day that does not exist in the month becomes the last day of that month. */
  private static clampDay(year: number, month: number, day: number): number {
    return Math.min(day, RecurrenceScheduleCalculator.daysInMonth(year, month));
  }

  /** Absolute month index, so adding months never needs a carry by hand. */
  private static toMonthIndex(date: CalendarDate): number {
    return date.year * 12 + (date.month - 1);
  }

  private static fromMonthIndex(monthIndex: number, anchorDay: number): CalendarDate {
    const year = Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    return { year, month, day: RecurrenceScheduleCalculator.clampDay(year, month, anchorDay) };
  }

  private static addDays(date: CalendarDate, days: number): CalendarDate {
    const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
    };
  }

  /** ISO week day (Monday = 1 … Sunday = 7) from the UTC week day (Sunday = 0). */
  private static isoWeekDay(date: CalendarDate): number {
    const weekDay = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
    return ((weekDay + 6) % 7) + 1;
  }
}
