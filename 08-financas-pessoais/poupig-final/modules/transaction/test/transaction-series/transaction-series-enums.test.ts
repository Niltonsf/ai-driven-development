import { DayOfWeek, FrequencyUnit, isDayOfWeek, isFrequencyUnit, isSeriesKind, SeriesKind } from '../../src';

describe('SeriesKind', () => {
  test('has exactly OPEN and CLOSED with values equal to their keys', () => {
    expect(Object.entries(SeriesKind)).toEqual([
      ['OPEN', 'OPEN'],
      ['CLOSED', 'CLOSED'],
    ]);
  });

  test('isSeriesKind approves every enum value', () => {
    expect(isSeriesKind('OPEN')).toBe(true);
    expect(isSeriesKind('CLOSED')).toBe(true);
    expect(isSeriesKind(SeriesKind.OPEN)).toBe(true);
    expect(isSeriesKind(SeriesKind.CLOSED)).toBe(true);
  });

  test.each([['open'], ['closed'], ['INSTALLMENT'], ['RECURRING'], [''], [undefined], [null], [1]])(
    'isSeriesKind rejects %p',
    (value) => {
      expect(isSeriesKind(value)).toBe(false);
    },
  );
});

describe('FrequencyUnit', () => {
  test('has exactly WEEK, MONTH and YEAR with values equal to their keys', () => {
    expect(Object.entries(FrequencyUnit)).toEqual([
      ['WEEK', 'WEEK'],
      ['MONTH', 'MONTH'],
      ['YEAR', 'YEAR'],
    ]);
  });

  test('isFrequencyUnit approves the three units and rejects DAY and month', () => {
    expect(isFrequencyUnit('WEEK')).toBe(true);
    expect(isFrequencyUnit('MONTH')).toBe(true);
    expect(isFrequencyUnit('YEAR')).toBe(true);
    expect(isFrequencyUnit('DAY')).toBe(false);
    expect(isFrequencyUnit('month')).toBe(false);
  });

  test.each([[''], [undefined], [null], [1], ['WEEKLY']])('isFrequencyUnit rejects %p', (value) => {
    expect(isFrequencyUnit(value)).toBe(false);
  });
});

describe('DayOfWeek', () => {
  test('numbers the week days in ISO-8601, starting on Monday', () => {
    expect(DayOfWeek.MONDAY).toBe(1);
    expect(DayOfWeek.TUESDAY).toBe(2);
    expect(DayOfWeek.WEDNESDAY).toBe(3);
    expect(DayOfWeek.THURSDAY).toBe(4);
    expect(DayOfWeek.FRIDAY).toBe(5);
    expect(DayOfWeek.SATURDAY).toBe(6);
    expect(DayOfWeek.SUNDAY).toBe(7);
  });

  test.each([1, 2, 3, 4, 5, 6, 7])('isDayOfWeek approves %p', (value) => {
    expect(isDayOfWeek(value)).toBe(true);
  });

  test.each([[0], [8], [1.5], [-1], ['MONDAY'], ['1'], [''], [undefined], [null], [NaN]])(
    'isDayOfWeek rejects %p',
    (value) => {
      expect(isDayOfWeek(value)).toBe(false);
    },
  );

  test('rejects the reverse mapping names of the numeric enum', () => {
    expect(isDayOfWeek(DayOfWeek[DayOfWeek.MONDAY])).toBe(false);
    expect(isDayOfWeek('SUNDAY')).toBe(false);
  });
});
