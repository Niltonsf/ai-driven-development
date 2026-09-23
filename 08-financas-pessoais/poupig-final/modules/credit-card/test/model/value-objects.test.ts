import { ClosingDay, DueDay, LastFourDigits } from '../../src/credit-card/model';

describe('ClosingDay', () => {
  test('accepts a day within 1..31', () => {
    expect(ClosingDay.create(15).value).toBe(15);
  });

  test.each([0, 32, -1])('rejects out-of-range day %p', (day) => {
    const result = ClosingDay.tryCreate(day);
    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('CLOSING_DAY_OUT_OF_RANGE');
  });

  test.each([1.5, NaN, Infinity, '10' as unknown as number])('rejects non-integer value %p', (value) => {
    const result = ClosingDay.tryCreate(value as number);
    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('INVALID_CLOSING_DAY');
  });

  test('create throws for an invalid value', () => {
    expect(() => ClosingDay.create(0)).toThrow();
  });
});

describe('DueDay', () => {
  test('accepts a day within 1..31', () => {
    expect(DueDay.create(10).value).toBe(10);
  });

  test.each([0, 32, -5])('rejects out-of-range day %p', (day) => {
    const result = DueDay.tryCreate(day);
    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('DUE_DAY_OUT_OF_RANGE');
  });

  test.each([2.5, NaN, '5' as unknown as number])('rejects non-integer value %p', (value) => {
    const result = DueDay.tryCreate(value as number);
    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('INVALID_DUE_DAY');
  });

  test('create throws for an invalid value', () => {
    expect(() => DueDay.create(40)).toThrow();
  });
});

describe('LastFourDigits', () => {
  test('accepts exactly four digits', () => {
    expect(LastFourDigits.create('1234').value).toBe('1234');
  });

  test.each(['123', '12345', 'abcd', '12a4', '' ])('rejects malformed value %p', (value) => {
    const result = LastFourDigits.tryCreate(value);
    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('INVALID_LAST_FOUR_DIGITS');
  });

  test('rejects a non-string value', () => {
    const result = LastFourDigits.tryCreate(1234 as unknown as string);
    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('INVALID_LAST_FOUR_DIGITS');
  });

  test('create throws for an invalid value', () => {
    expect(() => LastFourDigits.create('12')).toThrow();
  });
});
