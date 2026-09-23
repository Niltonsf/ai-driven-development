import { DayOfMonth, PositiveInteger, Result } from '@poupig/shared';
import { DayOfWeek, isDayOfWeek } from './day-of-week.enum';
import { FrequencyUnit, isFrequencyUnit } from './frequency-unit.enum';

/** Highest accepted interval, so a rule cannot describe an absurd frequency. */
export const MAX_RECURRENCE_INTERVAL = 99;

const MAX_RECURRENCE_MONTH = 12;

export const RecurrenceRuleErrors = {
  INVALID_RECURRENCE_FREQUENCY_UNIT: 'INVALID_RECURRENCE_FREQUENCY_UNIT',
  INVALID_RECURRENCE_INTERVAL: 'INVALID_RECURRENCE_INTERVAL',
  INVALID_RECURRENCE_WEEK_DAY: 'INVALID_RECURRENCE_WEEK_DAY',
  INVALID_RECURRENCE_DAY_OF_MONTH: 'INVALID_RECURRENCE_DAY_OF_MONTH',
  INVALID_RECURRENCE_MONTH: 'INVALID_RECURRENCE_MONTH',
} as const;

/**
 * Rule of a recurrence, discriminated by `unit`: each unit carries only its own
 * anchor.
 */
export type RecurrenceRule =
  | { unit: FrequencyUnit.WEEK; interval: number; weekDay: DayOfWeek }
  | { unit: FrequencyUnit.MONTH; interval: number; dayOfMonth: number }
  | { unit: FrequencyUnit.YEAR; interval: number; month: number; dayOfMonth: number };

/**
 * Raw input of a recurrence rule. Every field is optional and every number is
 * accepted as a number or as a numeric string, which is what an HTTP body and a
 * form produce.
 */
export interface RecurrenceRuleInput {
  unit?: string;
  interval?: number | string;
  weekDay?: number | string;
  dayOfMonth?: number | string;
  month?: number | string;
}

/** `undefined`, `null` and the empty string mean "absent"; text that is not numeric becomes `NaN`. */
function toNumber(value?: number | string | null): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return value;
  return Number(value.trim());
}

/** The value as a positive integer up to `max`, or `undefined` when it does not qualify. */
function toBoundedPositiveInteger(value: number | undefined, max: number): number | undefined {
  if (value === undefined) return undefined;

  const result = PositiveInteger.tryCreate(value);
  if (result.isFailure || result.instance.value > max) return undefined;

  return result.instance.value;
}

/**
 * Validates a raw recurrence rule and normalizes it: the returned rule carries
 * numbers and **only** the anchors of the chosen unit, so an anchor sent for
 * another unit is discarded instead of rejected. A day that does not exist in
 * the chosen month (30 February) is accepted, because the schedule calculation
 * clamps it. Failures are accumulated.
 */
export function tryCreateRecurrenceRule(input: RecurrenceRuleInput): Result<RecurrenceRule> {
  const errors: string[] = [];

  const rawUnit = input?.unit;
  const unit: FrequencyUnit | undefined = isFrequencyUnit(rawUnit) ? rawUnit : undefined;
  if (unit === undefined) {
    errors.push(RecurrenceRuleErrors.INVALID_RECURRENCE_FREQUENCY_UNIT);
  }

  const interval = toBoundedPositiveInteger(toNumber(input?.interval), MAX_RECURRENCE_INTERVAL);
  if (interval === undefined) {
    errors.push(RecurrenceRuleErrors.INVALID_RECURRENCE_INTERVAL);
  }

  let weekDay: DayOfWeek | undefined;
  let dayOfMonth: number | undefined;
  let month: number | undefined;

  // The anchors are only read for a valid unit: there is no anchor to require otherwise.
  if (unit === FrequencyUnit.WEEK) {
    const rawWeekDay = toNumber(input?.weekDay);
    if (isDayOfWeek(rawWeekDay)) {
      weekDay = rawWeekDay;
    } else {
      errors.push(RecurrenceRuleErrors.INVALID_RECURRENCE_WEEK_DAY);
    }
  }

  if (unit === FrequencyUnit.MONTH || unit === FrequencyUnit.YEAR) {
    const rawDayOfMonth = toNumber(input?.dayOfMonth);
    // Both codes of the value object become the code of the rule.
    const result = rawDayOfMonth === undefined ? undefined : DayOfMonth.tryCreate(rawDayOfMonth);
    if (result && result.isOk) {
      dayOfMonth = result.instance.value;
    } else {
      errors.push(RecurrenceRuleErrors.INVALID_RECURRENCE_DAY_OF_MONTH);
    }
  }

  if (unit === FrequencyUnit.YEAR) {
    month = toBoundedPositiveInteger(toNumber(input?.month), MAX_RECURRENCE_MONTH);
    if (month === undefined) {
      errors.push(RecurrenceRuleErrors.INVALID_RECURRENCE_MONTH);
    }
  }

  // A missing unit or interval always filled `errors`, so the failure is never empty.
  if (unit === undefined || interval === undefined || errors.length > 0) {
    return Result.fail(errors);
  }

  // A brand new object: an anchor of another unit disappears by construction.
  if (unit === FrequencyUnit.WEEK) {
    return Result.ok({ unit, interval, weekDay: weekDay! });
  }

  if (unit === FrequencyUnit.MONTH) {
    return Result.ok({ unit, interval, dayOfMonth: dayOfMonth! });
  }

  return Result.ok({ unit, interval, month: month!, dayOfMonth: dayOfMonth! });
}
