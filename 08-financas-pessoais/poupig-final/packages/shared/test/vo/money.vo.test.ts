import { Money } from '../../src';

describe('Money', () => {
  test('should create with valid positive amount in reais', () => {
    const result = Money.tryCreate(150.5);

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe(150.5);
  });

  test('should round up to two decimal places on creation', () => {
    const result = Money.tryCreate(10.126);

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe(10.13);
  });

  test('should round down to two decimal places on creation', () => {
    const result = Money.tryCreate(10.124);

    expect(result.isOk).toBe(true);
    expect(result.instance.value).toBe(10.12);
  });

  test('should fail when value is negative', () => {
    const result = Money.tryCreate(-10);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('INVALID_MONEY_AMOUNT');
  });

  test('should fail when value is zero', () => {
    const result = Money.tryCreate(0);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('INVALID_MONEY_AMOUNT');
  });

  test('should fail when value rounds to zero', () => {
    const result = Money.tryCreate(0.004);

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('INVALID_MONEY_AMOUNT');
  });

  test('should fail when value is not a finite number', () => {
    const nan = Money.tryCreate(Number.NaN);
    const positiveInfinity = Money.tryCreate(Number.POSITIVE_INFINITY);
    const negativeInfinity = Money.tryCreate(Number.NEGATIVE_INFINITY);

    expect(nan.isFailure).toBe(true);
    expect(nan.errors).toContain('INVALID_MONEY_AMOUNT');
    expect(positiveInfinity.isFailure).toBe(true);
    expect(positiveInfinity.errors).toContain('INVALID_MONEY_AMOUNT');
    expect(negativeInfinity.isFailure).toBe(true);
    expect(negativeInfinity.errors).toContain('INVALID_MONEY_AMOUNT');
  });

  test('should fail when value is not a number', () => {
    const text = Money.tryCreate('10' as unknown as number);
    const missing = Money.tryCreate(undefined as unknown as number);

    expect(text.isFailure).toBe(true);
    expect(text.errors).toContain('INVALID_MONEY_AMOUNT');
    expect(missing.isFailure).toBe(true);
    expect(missing.errors).toContain('INVALID_MONEY_AMOUNT');
  });

  test('should not throw from tryCreate with invalid input', () => {
    expect(() => Money.tryCreate(null as unknown as number)).not.toThrow();
    expect(Money.tryCreate(null as unknown as number).errors).toEqual(['INVALID_MONEY_AMOUNT']);
  });

  test('should throw when create receives invalid value', () => {
    expect(() => Money.create(0)).toThrow();
  });

  test('should create with create when value is valid', () => {
    const money = Money.create(99.99);

    expect(money.value).toBe(99.99);
  });

  test('should return default invalid error when unexpected error has no message', () => {
    const isFiniteSpy = jest.spyOn(Number, 'isFinite').mockImplementation(() => {
      throw {};
    });

    const result = Money.tryCreate(1);
    isFiniteSpy.mockRestore();

    expect(result.isFailure).toBe(true);
    expect(result.errors).toContain('INVALID_MONEY_AMOUNT');
  });
});
