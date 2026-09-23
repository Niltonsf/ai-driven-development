import {
  DayOfWeek,
  FrequencyUnit,
  MAX_RECURRENCE_INTERVAL,
  RecurrenceRuleErrors,
  tryCreateRecurrenceRule,
} from '../../src';

describe('tryCreateRecurrenceRule — valid rules', () => {
  test('accepts a weekly rule and keeps the numbers', () => {
    const result = tryCreateRecurrenceRule({ unit: 'WEEK', interval: 2, weekDay: 1 });

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ unit: FrequencyUnit.WEEK, interval: 2, weekDay: DayOfWeek.MONDAY });
  });

  test('converts numbers that arrive as strings', () => {
    const result = tryCreateRecurrenceRule({ unit: 'MONTH', interval: '3', dayOfMonth: '15' });

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ unit: FrequencyUnit.MONTH, interval: 3, dayOfMonth: 15 });
  });

  test('accepts a yearly rule preserving the three numeric fields', () => {
    const result = tryCreateRecurrenceRule({ unit: 'YEAR', interval: 1, month: 3, dayOfMonth: 10 });

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ unit: FrequencyUnit.YEAR, interval: 1, month: 3, dayOfMonth: 10 });
  });

  test('accepts a day that does not exist in the month of the yearly rule', () => {
    const result = tryCreateRecurrenceRule({ unit: 'YEAR', interval: 1, month: 2, dayOfMonth: 30 });

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ unit: FrequencyUnit.YEAR, interval: 1, month: 2, dayOfMonth: 30 });
  });

  test('discards the anchors of another unit without failing', () => {
    const result = tryCreateRecurrenceRule({ unit: 'MONTH', interval: 1, dayOfMonth: 5, weekDay: 3, month: 7 });

    expect(result.isOk).toBe(true);
    expect(result.instance).toEqual({ unit: FrequencyUnit.MONTH, interval: 1, dayOfMonth: 5 });
    expect(result.instance).not.toHaveProperty('weekDay');
    expect(result.instance).not.toHaveProperty('month');
  });

  test('accepts the interval at the ceiling', () => {
    const result = tryCreateRecurrenceRule({ unit: 'WEEK', interval: MAX_RECURRENCE_INTERVAL, weekDay: 5 });

    expect(result.isOk).toBe(true);
    expect(result.instance.interval).toBe(99);
  });

  test('accepts every day of the month from 1 to 31', () => {
    for (let day = 1; day <= 31; day += 1) {
      expect(tryCreateRecurrenceRule({ unit: 'MONTH', interval: 1, dayOfMonth: day }).isOk).toBe(true);
    }
  });
});

describe('tryCreateRecurrenceRule — invalid rules', () => {
  test('rejects a missing anchor for the unit', () => {
    const result = tryCreateRecurrenceRule({ unit: 'MONTH', interval: 1 });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([RecurrenceRuleErrors.INVALID_RECURRENCE_DAY_OF_MONTH]);
  });

  test('rejects a weekly rule without a valid week day', () => {
    expect(tryCreateRecurrenceRule({ unit: 'WEEK', interval: 1, weekDay: 8 }).errors).toEqual([
      RecurrenceRuleErrors.INVALID_RECURRENCE_WEEK_DAY,
    ]);
    expect(tryCreateRecurrenceRule({ unit: 'WEEK', interval: 1 }).errors).toEqual([
      RecurrenceRuleErrors.INVALID_RECURRENCE_WEEK_DAY,
    ]);
    expect(tryCreateRecurrenceRule({ unit: 'WEEK', interval: 1, weekDay: 'MONDAY' }).errors).toEqual([
      RecurrenceRuleErrors.INVALID_RECURRENCE_WEEK_DAY,
    ]);
  });

  test('rejects a yearly rule without a valid month', () => {
    expect(tryCreateRecurrenceRule({ unit: 'YEAR', interval: 1, month: 13, dayOfMonth: 10 }).errors).toEqual([
      RecurrenceRuleErrors.INVALID_RECURRENCE_MONTH,
    ]);
    expect(tryCreateRecurrenceRule({ unit: 'YEAR', interval: 1, dayOfMonth: 10 }).errors).toEqual([
      RecurrenceRuleErrors.INVALID_RECURRENCE_MONTH,
    ]);
  });

  test.each([[0], [-1], [1.5], [100], ['abc']])('rejects interval %p', (interval) => {
    const result = tryCreateRecurrenceRule({ unit: 'WEEK', interval, weekDay: 1 });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([RecurrenceRuleErrors.INVALID_RECURRENCE_INTERVAL]);
  });

  test('rejects a missing interval', () => {
    expect(tryCreateRecurrenceRule({ unit: 'WEEK', weekDay: 1 }).errors).toEqual([
      RecurrenceRuleErrors.INVALID_RECURRENCE_INTERVAL,
    ]);
    expect(tryCreateRecurrenceRule({ unit: 'WEEK', interval: '', weekDay: 1 }).errors).toEqual([
      RecurrenceRuleErrors.INVALID_RECURRENCE_INTERVAL,
    ]);
  });

  test('rejects a unit outside the set without reading any anchor', () => {
    const result = tryCreateRecurrenceRule({ unit: 'DAY', interval: 1 });

    expect(result.isFailure).toBe(true);
    expect(result.errors).toEqual([RecurrenceRuleErrors.INVALID_RECURRENCE_FREQUENCY_UNIT]);
  });

  test('rejects an empty rule with the unit and the interval codes', () => {
    const result = tryCreateRecurrenceRule({});

    expect(result.errors).toEqual([
      RecurrenceRuleErrors.INVALID_RECURRENCE_FREQUENCY_UNIT,
      RecurrenceRuleErrors.INVALID_RECURRENCE_INTERVAL,
    ]);
  });

  test.each([[0], [32], [1.5], ['abc']])('rejects dayOfMonth %p with the rule code', (dayOfMonth) => {
    const result = tryCreateRecurrenceRule({ unit: 'MONTH', interval: 1, dayOfMonth });

    expect(result.errors).toEqual([RecurrenceRuleErrors.INVALID_RECURRENCE_DAY_OF_MONTH]);
    expect(result.errors).not.toContain('INVALID_DAY_OF_MONTH');
    expect(result.errors).not.toContain('DAY_OF_MONTH_OUT_OF_RANGE');
  });

  test('accumulates the codes of every invalid field', () => {
    const result = tryCreateRecurrenceRule({ unit: 'YEAR', interval: 0, month: 13, dayOfMonth: 40 });

    expect(result.errors).toEqual([
      RecurrenceRuleErrors.INVALID_RECURRENCE_INTERVAL,
      RecurrenceRuleErrors.INVALID_RECURRENCE_DAY_OF_MONTH,
      RecurrenceRuleErrors.INVALID_RECURRENCE_MONTH,
    ]);
  });

  test('RecurrenceRuleErrors has exactly the five codes, each equal to its key', () => {
    expect(Object.keys(RecurrenceRuleErrors).sort()).toEqual(
      [
        'INVALID_RECURRENCE_FREQUENCY_UNIT',
        'INVALID_RECURRENCE_INTERVAL',
        'INVALID_RECURRENCE_WEEK_DAY',
        'INVALID_RECURRENCE_DAY_OF_MONTH',
        'INVALID_RECURRENCE_MONTH',
      ].sort(),
    );
    for (const [key, value] of Object.entries(RecurrenceRuleErrors)) {
      expect(value).toBe(key);
    }
  });
});
