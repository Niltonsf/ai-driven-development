/// <reference types="jest" />
import { optional } from '../../src/base/optional';
import { Result } from '../../src/base/result';

describe('optional', () => {
  test('returns undefined without touching the VO when value is undefined', () => {
    const vo = { tryCreate: jest.fn((value: unknown) => Result.ok(value)) };

    const result = optional(undefined, vo);

    expect(result).toBeUndefined();
    expect(vo.tryCreate).not.toHaveBeenCalled();
  });

  test('delegates to the VO and forwards its Result when a value is present', () => {
    const vo = { tryCreate: jest.fn((value: unknown) => Result.ok(value)) };

    const result = optional('abc', vo);

    expect(vo.tryCreate).toHaveBeenCalledWith('abc');
    expect(result?.instance).toBe('abc');
  });

  test('propagates a validation failure produced by the VO', () => {
    const vo = { tryCreate: jest.fn(() => Result.fail<string>('INVALID')) };

    const result = optional('bad', vo);

    expect(result?.isFailure).toBe(true);
    expect(result?.errors).toContain('INVALID');
  });

  test('treats null as a present value and still validates it', () => {
    const vo = { tryCreate: jest.fn((value: unknown) => Result.ok(value)) };

    const result = optional(null, vo);

    expect(result).not.toBeUndefined();
    expect(vo.tryCreate).toHaveBeenCalledWith(null);
  });
});
