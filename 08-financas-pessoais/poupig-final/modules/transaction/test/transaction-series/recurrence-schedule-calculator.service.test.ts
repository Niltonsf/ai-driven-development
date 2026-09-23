import { DayOfWeek, FrequencyUnit, RecurrenceRule, RecurrenceScheduleCalculator } from '../../src';

function weekly(interval: number, weekDay: DayOfWeek): RecurrenceRule {
  return { unit: FrequencyUnit.WEEK, interval, weekDay };
}

function monthly(interval: number, dayOfMonth: number): RecurrenceRule {
  return { unit: FrequencyUnit.MONTH, interval, dayOfMonth };
}

function yearly(interval: number, month: number, dayOfMonth: number): RecurrenceRule {
  return { unit: FrequencyUnit.YEAR, interval, month, dayOfMonth };
}

describe('RecurrenceScheduleCalculator — first occurrence', () => {
  test('keeps the monthly anchor of the month when it has not passed yet', () => {
    expect(RecurrenceScheduleCalculator.firstOccurrence('2026-01-10', monthly(1, 15))).toBe('2026-01-15');
  });

  test('moves to the next month when the monthly anchor has already passed', () => {
    expect(RecurrenceScheduleCalculator.firstOccurrence('2026-01-20', monthly(1, 15))).toBe('2026-02-15');
  });

  test('accepts the start date itself when it is the anchor day', () => {
    expect(RecurrenceScheduleCalculator.firstOccurrence('2026-01-15', monthly(1, 15))).toBe('2026-01-15');
  });

  test('walks from a Tuesday to the next Friday', () => {
    expect(RecurrenceScheduleCalculator.firstOccurrence('2026-09-15', weekly(1, DayOfWeek.FRIDAY))).toBe('2026-09-18');
  });

  test('moves to the next year when the yearly date has already passed', () => {
    expect(RecurrenceScheduleCalculator.firstOccurrence('2026-09-15', yearly(1, 9, 10))).toBe('2027-09-10');
  });

  test('clamps day 31 in the first occurrence', () => {
    expect(RecurrenceScheduleCalculator.firstOccurrence('2026-02-28', monthly(1, 31))).toBe('2026-02-28');
  });

  test('accepts the start date itself when it is the anchor week day', () => {
    // 2026-09-15 is a Tuesday.
    expect(RecurrenceScheduleCalculator.firstOccurrence('2026-09-15', weekly(2, DayOfWeek.TUESDAY))).toBe('2026-09-15');
  });

  test('does not apply the interval to the first occurrence', () => {
    // The interval only counts from the first occurrence: it is still the next month.
    expect(RecurrenceScheduleCalculator.firstOccurrence('2026-01-20', monthly(3, 15))).toBe('2026-02-15');
  });
});

describe('RecurrenceScheduleCalculator — following occurrences', () => {
  test('walks two weeks at a time from the first Monday', () => {
    const rule = weekly(2, DayOfWeek.MONDAY);

    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-09-15', rule, 0)).toBe('2026-09-21');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-09-15', rule, 1)).toBe('2026-10-05');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-09-15', rule, 2)).toBe('2026-10-19');
  });

  test('walks three months at a time', () => {
    const rule = monthly(3, 15);

    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-01-20', rule, 0)).toBe('2026-02-15');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-01-20', rule, 1)).toBe('2026-05-15');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-01-20', rule, 2)).toBe('2026-08-15');
  });

  test('walks one year at a time', () => {
    const rule = yearly(1, 3, 10);

    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-01-01', rule, 0)).toBe('2026-03-10');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-01-01', rule, 1)).toBe('2027-03-10');
  });

  test('clamps day 31 in months of 30 days without rewriting the anchor', () => {
    const rule = monthly(1, 31);

    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-04-01', rule, 0)).toBe('2026-04-30');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-04-01', rule, 1)).toBe('2026-05-31');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-04-01', rule, 2)).toBe('2026-06-30');
  });

  test('clamps day 31 in February of a common year and goes back to 31', () => {
    const rule = monthly(1, 31);

    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-01-31', rule, 0)).toBe('2026-01-31');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-01-31', rule, 1)).toBe('2026-02-28');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-01-31', rule, 2)).toBe('2026-03-31');
  });

  test('clamps day 31 in February of a leap year', () => {
    expect(RecurrenceScheduleCalculator.occurrenceAt('2028-01-31', monthly(1, 31), 1)).toBe('2028-02-29');
  });

  test('clamps 29 February in a common year and keeps it in a leap year', () => {
    const rule = yearly(1, 2, 29);

    expect(RecurrenceScheduleCalculator.occurrenceAt('2027-01-01', rule, 0)).toBe('2027-02-28');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2027-01-01', rule, 1)).toBe('2028-02-29');
  });

  test('crosses the end of the year in the monthly unit', () => {
    const rule = monthly(1, 10);

    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-11-01', rule, 0)).toBe('2026-11-10');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-11-01', rule, 1)).toBe('2026-12-10');
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-11-01', rule, 2)).toBe('2027-01-10');
  });
});

describe('RecurrenceScheduleCalculator — last occurrence', () => {
  test('is the occurrence of index n - 1', () => {
    expect(RecurrenceScheduleCalculator.lastOccurrence('2026-09-15', monthly(1, 10), 12)).toBe('2027-09-10');
  });

  test('of a single installment is the first occurrence', () => {
    const rule = monthly(1, 10);

    expect(RecurrenceScheduleCalculator.lastOccurrence('2026-09-15', rule, 1)).toBe(
      RecurrenceScheduleCalculator.firstOccurrence('2026-09-15', rule),
    );
  });
});

describe('RecurrenceScheduleCalculator — purity', () => {
  test('returns the same dates for the same inputs', () => {
    const rule = monthly(1, 31);
    const first = [0, 1, 2, 3].map((index) => RecurrenceScheduleCalculator.occurrenceAt('2026-01-31', rule, index));
    const second = [0, 1, 2, 3].map((index) => RecurrenceScheduleCalculator.occurrenceAt('2026-01-31', rule, index));

    expect(first).toEqual(second);
    expect(first).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });

  test('always returns the YYYY-MM-DD format', () => {
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-01-05', monthly(1, 5), 0)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(RecurrenceScheduleCalculator.occurrenceAt('2026-01-05', weekly(1, DayOfWeek.SUNDAY), 3)).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });
});

describe('RecurrenceScheduleCalculator — occurrences between', () => {
  const september2026 = { from: '2026-09-01', to: '2026-09-30' };
  const october2026 = { from: '2026-10-01', to: '2026-10-31' };
  const november2026 = { from: '2026-11-01', to: '2026-11-30' };
  const december2026 = { from: '2026-12-01', to: '2026-12-31' };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('is empty for a period before the start of the series', () => {
    expect(
      RecurrenceScheduleCalculator.occurrencesBetween('2026-09-15', monthly(1, 10), {
        ...september2026,
        installments: 12,
      }),
    ).toEqual([]);
  });

  test('is empty for a period after the last installment', () => {
    expect(
      RecurrenceScheduleCalculator.occurrencesBetween('2026-09-15', monthly(1, 10), {
        from: '2027-10-01',
        to: '2027-10-31',
        installments: 12,
      }),
    ).toEqual([]);
  });

  test('finds the occurrence of a period in the middle of the series', () => {
    expect(
      RecurrenceScheduleCalculator.occurrencesBetween('2026-09-15', monthly(1, 10), {
        from: '2027-01-01',
        to: '2027-01-31',
        installments: 12,
      }),
    ).toEqual([{ index: 3, date: '2027-01-10' }]);
  });

  test('finds four and five weekly occurrences in a month', () => {
    const rule = weekly(1, DayOfWeek.MONDAY);

    expect(RecurrenceScheduleCalculator.occurrencesBetween('2026-09-15', rule, october2026)).toEqual([
      { index: 2, date: '2026-10-05' },
      { index: 3, date: '2026-10-12' },
      { index: 4, date: '2026-10-19' },
      { index: 5, date: '2026-10-26' },
    ]);
    expect(RecurrenceScheduleCalculator.occurrencesBetween('2026-09-15', rule, november2026)).toEqual([
      { index: 6, date: '2026-11-02' },
      { index: 7, date: '2026-11-09' },
      { index: 8, date: '2026-11-16' },
      { index: 9, date: '2026-11-23' },
      { index: 10, date: '2026-11-30' },
    ]);
  });

  test('walks every two weeks', () => {
    const rule = weekly(2, DayOfWeek.MONDAY);

    expect(RecurrenceScheduleCalculator.occurrencesBetween('2026-09-15', rule, november2026)).toEqual([
      { index: 3, date: '2026-11-02' },
      { index: 4, date: '2026-11-16' },
      { index: 5, date: '2026-11-30' },
    ]);
    expect(RecurrenceScheduleCalculator.occurrencesBetween('2026-09-15', rule, december2026)).toEqual([
      { index: 6, date: '2026-12-14' },
      { index: 7, date: '2026-12-28' },
    ]);
  });

  test('every three months falls in one month and not in the next', () => {
    const rule = monthly(3, 15);

    expect(
      RecurrenceScheduleCalculator.occurrencesBetween('2026-01-20', rule, { from: '2026-08-01', to: '2026-08-31' }),
    ).toEqual([{ index: 2, date: '2026-08-15' }]);
    expect(RecurrenceScheduleCalculator.occurrencesBetween('2026-01-20', rule, september2026)).toEqual([]);
  });

  test('finds the yearly occurrence in its month only', () => {
    const rule = yearly(1, 3, 10);

    expect(
      RecurrenceScheduleCalculator.occurrencesBetween('2026-01-01', rule, { from: '2027-03-01', to: '2027-03-31' }),
    ).toEqual([{ index: 1, date: '2027-03-10' }]);
    expect(
      RecurrenceScheduleCalculator.occurrencesBetween('2026-01-01', rule, { from: '2027-04-01', to: '2027-04-30' }),
    ).toEqual([]);
  });

  test('clamps day 31 in a month of 30 days', () => {
    expect(
      RecurrenceScheduleCalculator.occurrencesBetween('2026-04-01', monthly(1, 31), {
        from: '2026-06-01',
        to: '2026-06-30',
      }),
    ).toEqual([{ index: 2, date: '2026-06-30' }]);
  });

  test('stops an installment plan that ends in the middle of the month', () => {
    expect(
      RecurrenceScheduleCalculator.occurrencesBetween('2026-09-15', weekly(1, DayOfWeek.MONDAY), {
        ...november2026,
        installments: 8,
      }),
    ).toEqual([
      { index: 6, date: '2026-11-02' },
      { index: 7, date: '2026-11-09' },
    ]);
  });

  test('stops a recurrence whose end date is in the middle of the month', () => {
    expect(
      RecurrenceScheduleCalculator.occurrencesBetween('2026-09-15', weekly(1, DayOfWeek.MONDAY), {
        ...november2026,
        endDate: '2026-11-15',
      }),
    ).toEqual([
      { index: 6, date: '2026-11-02' },
      { index: 7, date: '2026-11-09' },
    ]);
  });

  test('does not walk an old series from the first occurrence', () => {
    const spy = jest.spyOn(RecurrenceScheduleCalculator, 'occurrenceAt');

    const occurrences = RecurrenceScheduleCalculator.occurrencesBetween(
      '2020-01-06',
      weekly(1, DayOfWeek.MONDAY),
      september2026,
    );

    expect(occurrences).toEqual([
      { index: 348, date: '2026-09-07' },
      { index: 349, date: '2026-09-14' },
      { index: 350, date: '2026-09-21' },
      { index: 351, date: '2026-09-28' },
    ]);
    const calculatedIndexes = spy.mock.calls.map((call) => call[2]);
    expect(Math.min(...calculatedIndexes)).toBe(348);
    expect(calculatedIndexes.length).toBeLessThanOrEqual(6);
  });

  test('returns the same occurrences as occurrenceAt near the month-end clamp', () => {
    const rule = monthly(1, 31);
    const expected = [0, 1, 2, 3, 4, 5]
      .map((index) => ({ index, date: RecurrenceScheduleCalculator.occurrenceAt('2026-01-31', rule, index) }))
      .filter((occurrence) => occurrence.date >= '2026-02-01' && occurrence.date <= '2026-05-31');

    expect(
      RecurrenceScheduleCalculator.occurrencesBetween('2026-01-31', rule, { from: '2026-02-01', to: '2026-05-31' }),
    ).toEqual(expected);
  });
});
