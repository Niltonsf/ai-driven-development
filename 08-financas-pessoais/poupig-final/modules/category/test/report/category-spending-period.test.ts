import { CATEGORY_SPENDING_MAX_DAYS, isValidCategorySpendingPeriod } from '../../src';

describe('isValidCategorySpendingPeriod', () => {
  test('the ceiling is one whole leap year', () => {
    expect(CATEGORY_SPENDING_MAX_DAYS).toBe(366);
  });

  test.each([
    ['a common month', '2026-09-01', '2026-09-30'],
    ['a single day', '2026-09-15', '2026-09-15'],
    ['366 days across a year boundary', '2027-01-01', '2028-01-01'],
    ['366 days of a leap year', '2028-01-01', '2028-12-31'],
    ['the end of February of a leap year', '2028-02-01', '2028-02-29'],
  ])('accepts %s', (_, from, to) => {
    expect(isValidCategorySpendingPeriod(from, to)).toBe(true);
  });

  test.each([
    ['367 days', '2028-01-01', '2029-01-01'],
    ['an inverted period', '2026-09-30', '2026-09-01'],
    ['a month 13', '2026-13-01', '2026-13-31'],
    ['an impossible day', '2026-02-01', '2026-02-30'],
    ['an empty text', '', '2026-09-30'],
    ['an absent end', '2026-09-01', undefined],
    ['an absent start', undefined, '2026-09-30'],
    ['a date without leading zeros', '2026-9-1', '2026-09-30'],
    ['a full timestamp', '2026-09-01T00:00:00.000Z', '2026-09-30'],
    ['surrounding spaces', ' 2026-09-01', '2026-09-30'],
    ['a number', 20260901, '2026-09-30'],
    ['a Date', new Date('2026-09-01T00:00:00.000Z'), '2026-09-30'],
  ])('rejects %s', (_, from, to) => {
    expect(isValidCategorySpendingPeriod(from, to)).toBe(false);
  });
});
